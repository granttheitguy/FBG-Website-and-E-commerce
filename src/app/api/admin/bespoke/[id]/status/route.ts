import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { bespokeStatusUpdateSchema } from "@/lib/validation-schemas"
import { createNotification } from "@/lib/notifications"
import { sendEmail } from "@/lib/email"

/**
 * Helper function to generate user-friendly bespoke status messages
 */
function getBespokeStatusMessage(status: string, orderNumber: string): string {
    const formattedStatus = status.replace(/_/g, ' ').toLowerCase()
    switch (status) {
        case "CONSULTATION":
            return `Your bespoke order ${orderNumber} is in the consultation phase. Our team will reach out to discuss your requirements.`
        case "MEASUREMENT":
            return `Your bespoke order ${orderNumber} is ready for measurements. Please schedule an appointment with us.`
        case "DESIGN":
            return `Your bespoke order ${orderNumber} is being designed by our expert tailors.`
        case "FABRIC_SELECTION":
            return `It's time to select the perfect fabric for your bespoke order ${orderNumber}.`
        case "PRODUCTION":
            return `Your bespoke order ${orderNumber} is now in production. Our craftsmen are working on your piece.`
        case "FITTING":
            return `Your bespoke order ${orderNumber} is ready for fitting. We'll contact you to schedule an appointment.`
        case "FINAL_ADJUSTMENTS":
            return `Your bespoke order ${orderNumber} is undergoing final adjustments to ensure a perfect fit.`
        case "COMPLETED":
            return `Excellent news! Your bespoke order ${orderNumber} is complete and ready for pickup or delivery.`
        case "DELIVERED":
            return `Your bespoke order ${orderNumber} has been delivered. We hope you love your custom piece!`
        case "CANCELLED":
            return `Your bespoke order ${orderNumber} has been cancelled. Please contact us if you have any questions.`
        default:
            return `Your bespoke order ${orderNumber} is now in the ${formattedStatus} stage.`
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params
        const body = await req.json()

        const result = bespokeStatusUpdateSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const { status: newStatus, note } = result.data

        const order = await prisma.bespokeOrder.findUnique({
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
            return NextResponse.json({ error: "Bespoke order not found" }, { status: 404 })
        }

        const oldStatus = order.status

        if (oldStatus === newStatus) {
            return NextResponse.json(
                { error: "Order is already in this status" },
                { status: 400 }
            )
        }

        // Update status and create log in a transaction
        const updated = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.bespokeOrder.update({
                where: { id },
                data: {
                    status: newStatus,
                    // Set actual completion date when delivered
                    ...(newStatus === "DELIVERED" ? { actualCompletionDate: new Date() } : {}),
                },
            })

            await tx.bespokeStatusLog.create({
                data: {
                    bespokeOrderId: id,
                    changedByUserId: session!.user.id,
                    oldStatus,
                    newStatus,
                    note: note || null,
                },
            })

            return updatedOrder
        })

        await logActivity(
            session!.user.id,
            "UPDATE_BESPOKE_STATUS",
            "BESPOKE_ORDER",
            id,
            {
                orderNumber: order.orderNumber,
                from: oldStatus,
                to: newStatus,
                note: note || undefined,
            }
        )

        // Only notify if the bespoke order has a userId (linked customer)
        if (order.userId) {
            await createNotification(
                order.userId,
                `Bespoke Order ${order.orderNumber} Update`,
                getBespokeStatusMessage(newStatus, order.orderNumber),
                "BESPOKE",
                `/account/orders`
            )

            // Try to send email (wrapped in try/catch as SMTP may not be configured)
            if (order.user?.email) {
                try {
                    await sendEmail(
                        order.user.email,
                        `Bespoke Order ${order.orderNumber} - ${newStatus.replace(/_/g, ' ')}`,
                        `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #C8973E;">Bespoke Order Update</h1>
                                <p>Hello ${order.user.name},</p>
                                <p>${getBespokeStatusMessage(newStatus, order.orderNumber)}</p>
                                <div style="background-color: #F7F3ED; padding: 20px; border-radius: 4px; margin: 20px 0;">
                                    <p style="margin: 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                                    <p style="margin: 10px 0 0 0;"><strong>Status:</strong> ${newStatus.replace(/_/g, ' ')}</p>
                                    ${note ? `<p style="margin: 10px 0 0 0;"><strong>Note:</strong> ${note}</p>` : ''}
                                </div>
                                <p>
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders"
                                       style="background-color: #C8973E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                        View Your Orders
                                    </a>
                                </p>
                                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                    If you have any questions about your bespoke order, please contact us.
                                </p>
                            </div>
                        `
                    )
                } catch (emailError) {
                    // Continue execution - email failure should not block the status update
                }
            }
        }

        return NextResponse.json({
            ...updated,
            estimatedCompletionDate: updated.estimatedCompletionDate?.toISOString() ?? null,
            actualCompletionDate: updated.actualCompletionDate?.toISOString() ?? null,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
