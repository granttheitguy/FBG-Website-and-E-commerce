import { prisma } from "@/lib/db"

// ============================================
// Paystack Integration Library
// ============================================

interface PaystackInitializeResponse {
    status: boolean
    message: string
    data: {
        authorization_url: string
        access_code: string
        reference: string
    }
}

interface PaystackVerifyResponse {
    status: boolean
    message: string
    data: {
        id: number
        domain: string
        status: string // "success", "failed", "abandoned"
        reference: string
        amount: number // in kobo
        currency: string
        channel: string
        gateway_response: string
        ip_address: string
        paid_at: string | null
        customer: {
            id: number
            email: string
            first_name: string | null
            last_name: string | null
        }
        metadata: Record<string, unknown> | null
    }
}

interface PaystackMetadata {
    orderId: string
    orderNumber: string
    customerId?: string
    [key: string]: unknown
}

/**
 * Retrieves the Paystack secret key from StoreSettings.
 * For now reads the paystackSecretKeyEnc field as plain text.
 * Encryption layer can be added later.
 */
async function getSecretKey(): Promise<string> {
    const settings = await prisma.storeSettings.findFirst()

    if (!settings?.paystackSecretKeyEnc) {
        throw new Error("Paystack secret key is not configured in store settings")
    }

    // For now, read as plain text. Encryption/decryption can be layered in later.
    return settings.paystackSecretKeyEnc
}

/**
 * Initialize a Paystack payment transaction.
 *
 * @param email - Customer email address
 * @param amount - Amount in NGN (not kobo). Will be converted to kobo internally.
 * @param reference - Unique payment reference
 * @param callbackUrl - URL to redirect to after payment
 * @param metadata - Additional metadata to attach to the transaction
 * @returns Paystack authorization URL and reference
 */
export async function initializePayment(
    email: string,
    amount: number,
    reference: string,
    callbackUrl: string,
    metadata: PaystackMetadata
): Promise<PaystackInitializeResponse> {
    const secretKey = await getSecretKey()

    // Paystack expects amount in kobo (smallest currency unit)
    const amountInKobo = Math.round(amount * 100)

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            amount: amountInKobo,
            reference,
            callback_url: callbackUrl,
            metadata,
            currency: "NGN",
        }),
    })

    if (!response.ok) {
        const errorBody = await response.text()
        console.error("Paystack initialize error:", response.status, errorBody)
        throw new Error(`Paystack initialization failed: ${response.status}`)
    }

    const data: PaystackInitializeResponse = await response.json()

    if (!data.status) {
        throw new Error(`Paystack initialization failed: ${data.message}`)
    }

    return data
}

/**
 * Verify a Paystack payment transaction by reference.
 *
 * @param reference - The unique payment reference to verify
 * @returns Paystack verification response with transaction details
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const secretKey = await getSecretKey()

    const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        }
    )

    if (!response.ok) {
        const errorBody = await response.text()
        console.error("Paystack verify error:", response.status, errorBody)
        throw new Error(`Paystack verification failed: ${response.status}`)
    }

    const data: PaystackVerifyResponse = await response.json()

    if (!data.status) {
        throw new Error(`Paystack verification failed: ${data.message}`)
    }

    return data
}
