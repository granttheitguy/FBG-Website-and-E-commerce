import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPayment } from "@/lib/paystack"
import { fulfillPayment, failPayment } from "@/lib/payment-fulfillment"

// ============================================
// GET /api/payments/verify?reference=xxx
// Verifies payment with Paystack and fulfills order if successful
// ============================================

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const reference = searchParams.get("reference")

        if (!reference) {
            return NextResponse.json(
                { success: false, message: "Payment reference is required" },
                { status: 400 }
            )
        }

        // 1. Verify with Paystack
        const paystackResult = await verifyPayment(reference)
        const paystackStatus = paystackResult.data.status // "success", "failed", "abandoned"

        if (paystackStatus === "success") {
            // 2. Fulfill the payment (idempotent)
            const result = await fulfillPayment(
                reference,
                paystackResult.data.id?.toString()
            )

            if (!result) {
                return NextResponse.json(
                    { success: false, message: "Payment record not found" },
                    { status: 404 }
                )
            }

            // 3. Fetch the full order for the response
            const order = await prisma.order.findUnique({
                where: { id: result.orderId },
                include: {
                    items: true,
                    payments: {
                        where: { reference },
                        take: 1,
                    },
                },
            })

            return NextResponse.json({
                success: true,
                message: result.alreadyProcessed
                    ? "Payment already verified"
                    : "Payment verified successfully",
                data: {
                    order: {
                        id: order!.id,
                        orderNumber: order!.orderNumber,
                        status: order!.status,
                        paymentStatus: order!.paymentStatus,
                        subtotal: order!.subtotal,
                        shippingCost: order!.shippingCost,
                        couponDiscount: order!.couponDiscount,
                        total: order!.total,
                        currency: order!.currency,
                        items: order!.items.map((item) => ({
                            name: item.nameSnapshot,
                            sku: item.skuSnapshot,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                        })),
                        shippingAddress: order!.shippingAddress as Record<string, string> | null,
                        paidAt: order!.payments[0]?.paidAt,
                    },
                    reference,
                    paystackStatus: paystackStatus,
                },
            })
        } else {
            // Payment failed or was abandoned
            await failPayment(reference)

            return NextResponse.json({
                success: false,
                message:
                    paystackStatus === "abandoned"
                        ? "Payment was abandoned. You can try again."
                        : "Payment failed. Please try again or use a different payment method.",
                data: {
                    reference,
                    paystackStatus,
                },
            })
        }
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "An error occurred while verifying your payment.",
            },
            { status: 500 }
        )
    }
}
