"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"

export type MessageActionState = {
    success?: boolean
    error?: string
}

export async function markAsRead(id: string): Promise<MessageActionState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const message = await prisma.contactMessage.findUnique({
            where: { id },
        })

        if (!message) {
            return { error: "Message not found" }
        }

        if (message.isRead) {
            return { success: true }
        }

        await prisma.contactMessage.update({
            where: { id },
            data: { isRead: true },
        })

        revalidatePath("/admin/messages")
        revalidatePath(`/admin/messages/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Mark as read failed:", error)
        return { error: "Failed to mark message as read" }
    }
}

export async function deleteMessage(id: string): Promise<MessageActionState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const message = await prisma.contactMessage.findUnique({
            where: { id },
        })

        if (!message) {
            return { error: "Message not found" }
        }

        await prisma.contactMessage.delete({
            where: { id },
        })

        await logActivity(
            session.user.id,
            "DELETE_CONTACT_MESSAGE",
            "ContactMessage",
            id,
            { email: message.email, firstName: message.firstName, lastName: message.lastName }
        )

        revalidatePath("/admin/messages")
        return { success: true }
    } catch (error) {
        console.error("Message deletion failed:", error)
        return { error: "Failed to delete message" }
    }
}
