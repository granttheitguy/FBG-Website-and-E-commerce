import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"
import { sendEmail } from "@/lib/email"

/**
 * Helper function to generate user-friendly status messages
 */
function getOrderStatusMessage(status: string, orderNumber: string): string {
    switch (status) {
        case "PROCESSING":
            return `Your order ${orderNumber} is being processed and will be shipped soon.`
        case "SHIPPED":
            return `Great news! Your order ${orderNumber} has been shipped and is on its way.`
        case "DELIVERED":
            return `Your order ${orderNumber} has been delivered. We hope you enjoy your purchase!`
        case "CANCELLED":
            return `Your order ${orderNumber} has been cancelled. If you have questions, please contact support.`
        default:
            return `Your order ${orderNumber} status has been updated to ${status}.`
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        // Check if user is admin or staff
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN" && session.user.role !== "STAFF")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { status } = body

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Update order and create log
        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id },
                data: { status }
            })

            await tx.orderStatusLog.create({
                data: {
                    orderId: id,
                    changedByUserId: session.user.id,
                    oldStatus: order.status,
                    newStatus: status,
                    note: `Status updated to ${status}`
                }
            })

            return updated
        })

        // Send notification to customer if order has a userId
        if (order.userId) {
            await createNotification(
                order.userId,
                `Order ${order.orderNumber} - ${status}`,
                getOrderStatusMessage(status, order.orderNumber),
                "ORDER_UPDATE",
                `/account/orders/${order.id}`
            )
        }

        // Try to send email (wrapped in try/catch as SMTP may not be configured)
        if (order.user?.email) {
            try {
                await sendEmail(
                    order.user.email,
                    `Order ${order.orderNumber} Update - ${status}`,
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #C8973E;">Order Status Update</h1>
                            <p>Hello ${order.user.name},</p>
                            <p>${getOrderStatusMessage(status, order.orderNumber)}</p>
                            <div style="background-color: #F7F3ED; padding: 20px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                                <p style="margin: 10px 0 0 0;"><strong>Status:</strong> ${status}</p>
                            </div>
                            <p>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}"
                                   style="background-color: #C8973E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                    View Order Details
                                </a>
                            </p>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                If you have any questions, please contact our support team.
                            </p>
                        </div>
                    `
                )
            } catch {
                // Continue execution - email failure should not block the status update
            }
        }

        return NextResponse.json(updatedOrder)
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
