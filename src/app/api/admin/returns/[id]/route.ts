import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { createNotification } from "@/lib/notifications"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const body = await req.json()
        const { status, refundAmount, adminNotes } = body

        if (!status || !["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
            return NextResponse.json(
                { error: "Status must be APPROVED, REJECTED, or COMPLETED" },
                { status: 400 }
            )
        }

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: { order: true },
        })

        if (!returnRequest) {
            return NextResponse.json(
                { error: "Return request not found" },
                { status: 404 }
            )
        }

        // Validate refund amount if provided
        if (refundAmount !== undefined && refundAmount !== null) {
            if (typeof refundAmount !== "number" || refundAmount < 0) {
                return NextResponse.json(
                    { error: "Refund amount must be a positive number" },
                    { status: 400 }
                )
            }
            if (refundAmount > returnRequest.order.total) {
                return NextResponse.json(
                    { error: "Refund amount cannot exceed order total" },
                    { status: 400 }
                )
            }
        }

        const updateData: Record<string, unknown> = { status }

        if (refundAmount !== undefined && refundAmount !== null) {
            updateData.refundAmount = refundAmount
        }

        if (adminNotes !== undefined) {
            updateData.adminNotes = adminNotes
        }

        const updated = await prisma.returnRequest.update({
            where: { id },
            data: updateData,
        })

        await logActivity(
            session!.user.id,
            `RETURN_${status}`,
            "ReturnRequest",
            id,
            {
                orderId: returnRequest.orderId,
                previousStatus: returnRequest.status,
                newStatus: status,
                refundAmount: refundAmount ?? null,
            }
        )

        // Notify customer about the return request decision
        const notificationTitle = status === "APPROVED"
            ? "Return Request Approved"
            : status === "REJECTED"
                ? "Return Request Rejected"
                : "Return Request Update"

        let notificationMessage = ""
        if (status === "APPROVED") {
            notificationMessage = `Your return request for order ${returnRequest.order.orderNumber} has been approved${refundAmount ? ` with a refund of ₦${refundAmount.toLocaleString()}` : ""}.`
        } else if (status === "REJECTED") {
            notificationMessage = `Your return request for order ${returnRequest.order.orderNumber} has been rejected.${adminNotes ? ` Reason: ${adminNotes}` : ""}`
        } else if (status === "COMPLETED") {
            notificationMessage = `Your return for order ${returnRequest.order.orderNumber} has been completed${refundAmount ? ` and ₦${refundAmount.toLocaleString()} has been refunded` : ""}.`
        }

        // Only send notification if order has a userId
        if (returnRequest.order.userId) {
            await createNotification(
                returnRequest.order.userId,
                notificationTitle,
                notificationMessage,
                "ORDER_UPDATE",
                `/account/orders/${returnRequest.orderId}`
            )
        }

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
