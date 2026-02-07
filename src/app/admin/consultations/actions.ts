"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"

type ConsultationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

export type ConsultationActionState = {
    success?: boolean
    error?: string
}

const VALID_STATUSES: ConsultationStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]

export async function updateConsultationStatus(
    id: string,
    status: ConsultationStatus
): Promise<ConsultationActionState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    if (!VALID_STATUSES.includes(status)) {
        return { error: "Invalid status" }
    }

    try {
        const booking = await prisma.consultationBooking.findUnique({
            where: { id },
        })

        if (!booking) {
            return { error: "Consultation booking not found" }
        }

        await prisma.consultationBooking.update({
            where: { id },
            data: { status },
        })

        await logActivity(
            session.user.id,
            "UPDATE_CONSULTATION_STATUS",
            "ConsultationBooking",
            id,
            { oldStatus: booking.status, newStatus: status }
        )

        revalidatePath("/admin/consultations")
        revalidatePath(`/admin/consultations/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Consultation status update failed:", error)
        return { error: "Failed to update consultation status" }
    }
}
