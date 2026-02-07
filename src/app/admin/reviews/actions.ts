"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"

export type ReviewActionState = {
    success?: boolean
    error?: string
}

export async function moderateReview(
    id: string,
    status: "APPROVED" | "REJECTED"
): Promise<ReviewActionState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
        return { error: "Invalid status" }
    }

    try {
        const review = await prisma.review.findUnique({
            where: { id },
        })

        if (!review) {
            return { error: "Review not found" }
        }

        await prisma.review.update({
            where: { id },
            data: { status },
        })

        await logActivity(
            session.user.id,
            `MODERATE_REVIEW_${status}`,
            "Review",
            id,
            { productId: review.productId }
        )

        revalidatePath("/admin/reviews")
        return { success: true }
    } catch (error) {
        console.error("Review moderation failed:", error)
        return { error: "Failed to moderate review" }
    }
}

export async function deleteReview(id: string): Promise<ReviewActionState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const review = await prisma.review.findUnique({
            where: { id },
        })

        if (!review) {
            return { error: "Review not found" }
        }

        await prisma.review.delete({
            where: { id },
        })

        await logActivity(
            session.user.id,
            "DELETE_REVIEW",
            "Review",
            id,
            { productId: review.productId }
        )

        revalidatePath("/admin/reviews")
        return { success: true }
    } catch (error) {
        console.error("Review deletion failed:", error)
        return { error: "Failed to delete review" }
    }
}
