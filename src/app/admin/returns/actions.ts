"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function processReturn(
    id: string,
    status: string,
    refundAmount?: number | null,
    adminNotes?: string | null
) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
        return { error: "Invalid status" }
    }

    const returnRequest = await prisma.returnRequest.findUnique({
        where: { id },
        include: { order: true },
    })

    if (!returnRequest) {
        return { error: "Return request not found" }
    }

    // Validate refund amount
    if (refundAmount !== undefined && refundAmount !== null) {
        if (refundAmount < 0) {
            return { error: "Refund amount must be a positive number" }
        }
        if (refundAmount > returnRequest.order.total) {
            return { error: "Refund amount cannot exceed the order total" }
        }
    }

    const updateData: Record<string, unknown> = { status }

    if (refundAmount !== undefined && refundAmount !== null) {
        updateData.refundAmount = refundAmount
    }

    if (adminNotes !== undefined && adminNotes !== null) {
        updateData.adminNotes = adminNotes
    }

    await prisma.returnRequest.update({
        where: { id },
        data: updateData,
    })

    await logActivity(
        session.user.id,
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

    revalidatePath("/admin/returns")
    revalidatePath(`/admin/returns/${id}`)

    return { success: true }
}
