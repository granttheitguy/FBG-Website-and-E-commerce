import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fulfillPayment } from "@/lib/payment-fulfillment"
import crypto from "crypto"

// ============================================
// POST /api/webhooks/paystack
// Handles Paystack webhook events with HMAC signature verification
// ============================================

/**
 * Verify the Paystack webhook signature using HMAC SHA512.
 * Paystack sends the signature in the x-paystack-signature header.
 */
async function verifyWebhookSignature(
    body: string,
    signature: string
): Promise<boolean> {
    const settings = await prisma.storeSettings.findFirst()
    const secretKey = settings?.paystackSecretKeyEnc

    if (!secretKey) {
        return false
    }

    const hash = crypto
        .createHmac("sha512", secretKey)
        .update(body)
        .digest("hex")

    try {
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
    } catch {
        return false
    }
}

export async function POST(request: Request) {
    try {
        // 1. Read raw body for signature verification
        const rawBody = await request.text()
        const signature = request.headers.get("x-paystack-signature") || ""

        // 2. Verify webhook signature
        const isValid = await verifyWebhookSignature(rawBody, signature)

        if (!isValid) {
            return NextResponse.json(
                { success: false, message: "Invalid signature" },
                { status: 401 }
            )
        }

        // 3. Parse the event payload
        let event: {
            event: string
            data: {
                reference: string
                status: string
                id: number
                amount: number
                currency: string
                customer: { email: string }
                metadata?: Record<string, unknown>
            }
        }

        try {
            event = JSON.parse(rawBody)
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid JSON payload" },
                { status: 400 }
            )
        }

        // 4. Handle events
        switch (event.event) {
            case "charge.success": {
                const reference = event.data.reference

                if (!reference) {
                    break
                }

                const expectedAmount = event.data.amount / 100

                // fulfillPayment is idempotent -- safe to call multiple times
                const result = await fulfillPayment(
                    reference,
                    event.data.id?.toString(),
                    expectedAmount
                )

                break
            }

            // Additional events can be handled here (e.g., transfer.success, refund.processed)
            default:
                break
        }

        // 5. Always return 200 to acknowledge receipt
        // Paystack will retry on non-200 responses
        return NextResponse.json({ success: true, message: "Webhook received" })
    } catch {
        // Still return 200 to prevent Paystack from retrying on our internal errors
        // The idempotent fulfillment ensures we can safely reprocess
        return NextResponse.json({ success: true, message: "Webhook received" })
    }
}
