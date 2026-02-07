import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { formatCurrency } from "@/lib/utils"

/**
 * Processes a successful payment: updates payment/order records,
 * deducts inventory, creates stock movements, and sends confirmation email.
 *
 * This function is idempotent -- if the payment is already marked SUCCESS,
 * it returns early without performing duplicate work.
 *
 * @param reference - The unique Paystack payment reference
 * @param providerRef - The Paystack transaction ID (optional)
 * @returns The updated order, or null if the payment was already processed
 */
export async function fulfillPayment(
    reference: string,
    providerRef?: string,
    expectedAmount?: number
): Promise<{ orderId: string; orderNumber: string; alreadyProcessed: boolean } | null> {
    // 1. Find the payment record
    const payment = await prisma.payment.findUnique({
        where: { reference },
        include: {
            order: {
                include: {
                    items: {
                        include: {
                            productVariant: true,
                        },
                    },
                },
            },
        },
    })

    if (!payment) {
        console.error(`Payment not found for reference: ${reference}`)
        return null
    }

    // 2. Amount verification -- reject if mismatch
    if (expectedAmount !== undefined && payment.amount !== expectedAmount) {
        console.error(`Payment amount mismatch for ${reference}: expected ${expectedAmount}, got ${payment.amount}`)
        return null
    }

    // 3. Idempotency check -- if already processed, skip
    if (payment.status === "SUCCESS") {
        return {
            orderId: payment.order.id,
            orderNumber: payment.order.orderNumber,
            alreadyProcessed: true,
        }
    }

    // 4. Run fulfillment in a transaction for atomicity
    const order = await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: "SUCCESS",
                providerRef: providerRef ?? undefined,
                paidAt: new Date(),
            },
        })

        // Update order payment status
        const updatedOrder = await tx.order.update({
            where: { id: payment.orderId },
            data: {
                paymentStatus: "PAID",
                status: "PROCESSING",
            },
        })

        // Deduct inventory and create stock movements for each order item
        for (const item of payment.order.items) {
            // Deduct stock
            await tx.productVariant.update({
                where: { id: item.productVariantId },
                data: {
                    stockQty: {
                        decrement: item.quantity,
                    },
                },
            })

            // Create stock movement record
            await tx.stockMovement.create({
                data: {
                    productVariantId: item.productVariantId,
                    type: "DEDUCTION",
                    quantity: item.quantity,
                    reason: `Order ${updatedOrder.orderNumber} - payment confirmed`,
                    referenceId: updatedOrder.id,
                },
            })
        }

        return updatedOrder
    })

    // 5. Send confirmation email (non-blocking, outside transaction)
    try {
        if (order.customerEmail) {
            const orderItems = payment.order.items
            const itemsHtml = orderItems
                .map(
                    (item) =>
                        `<tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.nameSnapshot}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.totalPrice)}</td>
                        </tr>`
                )
                .join("")

            const emailHtml = `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                    <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #1a1a1a;">
                        <h1 style="font-size: 24px; letter-spacing: 0.12em; margin: 0;">FBG</h1>
                        <p style="font-size: 12px; color: #666; margin: 4px 0 0;">FASHION BY GRANT</p>
                    </div>
                    <div style="padding: 32px 0;">
                        <h2 style="font-size: 20px; margin: 0 0 8px;">Order Confirmed</h2>
                        <p style="color: #666; margin: 0 0 24px;">Thank you for your purchase! Your order has been received and is being processed.</p>

                        <div style="background: #f9f8f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
                            <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold;">${order.orderNumber}</p>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="border-bottom: 2px solid #1a1a1a;">
                                    <th style="padding: 8px; text-align: left;">Item</th>
                                    <th style="padding: 8px; text-align: center;">Qty</th>
                                    <th style="padding: 8px; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a1a;">
                            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                                <span style="color: #666;">Subtotal</span>
                                <span>${formatCurrency(order.subtotal)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                                <span style="color: #666;">Shipping</span>
                                <span>${formatCurrency(order.shippingCost)}</span>
                            </div>
                            ${order.couponDiscount > 0 ? `
                            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                                <span style="color: #666;">Discount</span>
                                <span>-${formatCurrency(order.couponDiscount)}</span>
                            </div>
                            ` : ""}
                            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                                <span>Total</span>
                                <span>${formatCurrency(order.total)}</span>
                            </div>
                        </div>

                        <p style="color: #666; font-size: 14px; margin-top: 24px;">
                            We will notify you when your order has been shipped. If you have any questions,
                            please reply to this email or contact our support team.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 16px 0; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                        <p style="margin: 0;">Fashion By Grant</p>
                    </div>
                </div>
            `

            await sendEmail(
                order.customerEmail,
                `Order Confirmed - ${order.orderNumber}`,
                emailHtml
            )
        }
    } catch (emailError) {
        // Log but do not fail the payment fulfillment if email fails
        console.error("Failed to send order confirmation email:", emailError)
    }

    return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        alreadyProcessed: false,
    }
}

/**
 * Marks a payment as failed and updates the associated order.
 */
export async function failPayment(reference: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
        where: { reference },
    })

    if (!payment) {
        console.error(`Payment not found for reference: ${reference}`)
        return
    }

    // Don't override a successful payment
    if (payment.status === "SUCCESS") {
        return
    }

    await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
        }),
        prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: "FAILED" },
        }),
    ])
}
