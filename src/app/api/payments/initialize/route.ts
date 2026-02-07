import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { initializePayment } from "@/lib/paystack"
import { generateOrderNumber } from "@/lib/utils"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"
import { z } from "zod"

// ============================================
// POST /api/payments/initialize
// Creates order, payment record, and returns Paystack authorization URL
// ============================================

const checkoutItemSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    name: z.string().min(1),
    size: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
})

const checkoutSchema = z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    address: z.string().min(1, "Address is required").max(200),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    zip: z.string().max(20).default(""),
    phone: z.string().min(1, "Phone is required").max(20),
    items: z.array(checkoutItemSchema).min(1, "At least one item is required"),
    shippingRateId: z.string().min(1, "Shipping rate is required"),
    couponCode: z.string().optional(),
})

export async function POST(request: Request) {
    try {
        // 1. Rate limiting
        const clientId = getClientIdentifier(request)
        const rateLimitResult = await rateLimit(`checkout:${clientId}`, rateLimitConfigs.order)
        const rateLimitErr = rateLimitResponse(rateLimitResult)
        if (rateLimitErr) return rateLimitErr

        // 2. Parse and validate input
        const body = await request.json()
        const validation = checkoutSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors: validation.error.flatten().fieldErrors,
                },
                { status: 422 }
            )
        }

        const data = validation.data

        // 3. Get logged-in user (optional -- guest checkout is allowed)
        const session = await auth()
        const userId = session?.user?.id ?? null

        // 4. Validate stock availability and verify prices against DB
        const variantIds = data.items.map((item) => item.variantId)
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: true },
        })

        const variantMap = new Map(variants.map((v) => [v.id, v]))

        const stockErrors: string[] = []
        let verifiedSubtotal = 0

        for (const item of data.items) {
            const variant = variantMap.get(item.variantId)

            if (!variant) {
                stockErrors.push(`Product variant ${item.variantId} not found`)
                continue
            }

            if (variant.product.status !== "ACTIVE") {
                stockErrors.push(`${variant.product.name} is no longer available`)
                continue
            }

            if (variant.status !== "ACTIVE") {
                stockErrors.push(`${variant.product.name} (${variant.size ?? variant.color ?? "variant"}) is no longer available`)
                continue
            }

            if (variant.stockQty < item.quantity) {
                stockErrors.push(
                    `Insufficient stock for ${variant.product.name} (${variant.size ?? ""}). Available: ${variant.stockQty}, Requested: ${item.quantity}`
                )
                continue
            }

            // Use the DB price, never the client-supplied price
            const unitPrice = variant.priceOverride ?? variant.product.basePrice
            verifiedSubtotal += unitPrice * item.quantity
        }

        if (stockErrors.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Some items are unavailable",
                    errors: stockErrors,
                },
                { status: 409 }
            )
        }

        // 5. Validate and fetch shipping rate
        const shippingRate = await prisma.shippingRate.findUnique({
            where: { id: data.shippingRateId },
            include: { zone: true },
        })

        if (!shippingRate || !shippingRate.isActive || !shippingRate.zone.isActive) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Selected shipping rate is not available",
                },
                { status: 400 }
            )
        }

        const shippingCost = shippingRate.price

        // 6. Apply coupon if provided
        let couponDiscount = 0
        let couponCode: string | null = null

        if (data.couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: data.couponCode.toUpperCase() },
            })

            if (coupon && coupon.isActive) {
                const now = new Date()
                const isValid =
                    (!coupon.startsAt || coupon.startsAt <= now) &&
                    (!coupon.expiresAt || coupon.expiresAt >= now) &&
                    (!coupon.maxUses || coupon.usedCount < coupon.maxUses)

                if (isValid) {
                    if (coupon.minOrderAmount && verifiedSubtotal < coupon.minOrderAmount) {
                        return NextResponse.json(
                            {
                                success: false,
                                message: `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`,
                            },
                            { status: 400 }
                        )
                    }

                    if (coupon.type === "PERCENTAGE") {
                        couponDiscount = Math.round((verifiedSubtotal * coupon.value) / 100)
                    } else {
                        couponDiscount = Math.min(coupon.value, verifiedSubtotal)
                    }

                    couponCode = coupon.code

                    // Increment usage
                    await prisma.coupon.update({
                        where: { id: coupon.id },
                        data: { usedCount: { increment: 1 } },
                    })
                }
            }
        }

        // 7. Calculate total
        const total = verifiedSubtotal + shippingCost - couponDiscount

        // 8. Generate order number and payment reference
        const orderNumber = generateOrderNumber()
        const paymentReference = `PAY-${orderNumber}-${Date.now()}`

        // 9. Create order and payment in a transaction
        const { order, payment } = await prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    customerEmail: data.email,
                    status: "PENDING",
                    paymentStatus: "UNPAID",
                    subtotal: verifiedSubtotal,
                    shippingCost,
                    discountTotal: couponDiscount,
                    couponCode,
                    couponDiscount,
                    total,
                    currency: "NGN",
                    shippingAddress: JSON.stringify({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        zip: data.zip,
                        phone: data.phone,
                    }),
                    items: {
                        create: data.items.map((item) => {
                            const variant = variantMap.get(item.variantId)!
                            const unitPrice = variant.priceOverride ?? variant.product.basePrice
                            return {
                                productId: item.productId,
                                productVariantId: item.variantId,
                                nameSnapshot: variant.product.name,
                                skuSnapshot: variant.sku,
                                unitPrice,
                                quantity: item.quantity,
                                totalPrice: unitPrice * item.quantity,
                            }
                        }),
                    },
                },
            })

            const createdPayment = await tx.payment.create({
                data: {
                    orderId: createdOrder.id,
                    reference: paymentReference,
                    amount: total,
                    currency: "NGN",
                    status: "PENDING",
                    provider: "PAYSTACK",
                    metadata: JSON.stringify({
                        email: data.email,
                        shippingRateId: data.shippingRateId,
                    }),
                },
            })

            return { order: createdOrder, payment: createdPayment }
        })

        // 10. Initialize Paystack payment
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
        const callbackUrl = `${appUrl}/checkout/success?reference=${paymentReference}`

        const paystackResponse = await initializePayment(
            data.email,
            total,
            paymentReference,
            callbackUrl,
            {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerId: userId ?? undefined,
            }
        )

        // 11. Return authorization URL
        return NextResponse.json(
            {
                success: true,
                message: "Payment initialized",
                data: {
                    authorization_url: paystackResponse.data.authorization_url,
                    reference: paymentReference,
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                },
            },
            { status: 201 }
        )
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "An error occurred while processing your payment. Please try again.",
            },
            { status: 500 }
        )
    }
}
