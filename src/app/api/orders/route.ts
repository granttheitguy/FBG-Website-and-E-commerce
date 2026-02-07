import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { generateOrderNumber } from "@/lib/utils"
import { orderSchema } from "@/lib/validation-schemas"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.order)
    const limitResponse = rateLimitResponse(rateLimitResult)
    if (limitResponse) return limitResponse

    try {
        const body = await req.json()

        // Validate input
        const validatedData = orderSchema.parse(body)
        const { email, firstName, lastName, address, city, state, zip, phone, items, total } = validatedData

        // 1. Create or find customer (simplified for guest checkout)
        // In a real app, we'd check if user is logged in or create a guest customer record

        // 2. Create Order
        const orderNumber = generateOrderNumber()

        const order = await prisma.order.create({
            data: {
                orderNumber,
                subtotal: total,
                shippingCost: 0,
                total,
                status: "PENDING",
                paymentStatus: "UNPAID",
                customerEmail: email,
                shippingAddress: JSON.stringify({ firstName, lastName, address, city, state, zip, phone }),

                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        productVariantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: item.price * item.quantity,
                        nameSnapshot: item.name,
                        skuSnapshot: item.size
                    }))
                }
            }
        })

        // Send Confirmation Email
        try {
            const recipientEmail = email // Use the email from the order form
            if (recipientEmail) {
                await sendEmail(
                    recipientEmail,
                    `Order Confirmation #${order.orderNumber}`,
                    `<h1>Thank you for your order!</h1><p>Your order #${order.orderNumber} has been received and is being processed.</p><p>Total: ₦${order.total.toLocaleString()}</p>`,
                    `Thank you for your order! Your order #${order.orderNumber} has been received. Total: ₦${order.total.toLocaleString()}`
                )
            }
        } catch {
            // Do not block the order creation response if email fails
        }

        return NextResponse.json(order)
    } catch {
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }
}
