"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"

export type NewsletterActionState = {
    success?: boolean
    error?: string
}

export async function toggleSubscription(id: string): Promise<NewsletterActionState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const subscriber = await prisma.newsletterSubscriber.findUnique({
            where: { id },
        })

        if (!subscriber) {
            return { error: "Subscriber not found" }
        }

        const newStatus = !subscriber.isSubscribed

        await prisma.newsletterSubscriber.update({
            where: { id },
            data: {
                isSubscribed: newStatus,
                unsubscribedAt: newStatus ? null : new Date(),
            },
        })

        await logActivity(
            session.user.id,
            newStatus ? "RESUBSCRIBE_NEWSLETTER" : "UNSUBSCRIBE_NEWSLETTER",
            "NewsletterSubscriber",
            id,
            { email: subscriber.email }
        )

        revalidatePath("/admin/newsletter")
        return { success: true }
    } catch (error) {
        console.error("Toggle subscription failed:", error)
        return { error: "Failed to update subscription status" }
    }
}

export async function exportSubscribersCsv(): Promise<{ csv?: string; error?: string }> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const subscribers = await prisma.newsletterSubscriber.findMany({
            where: { isSubscribed: true },
            orderBy: { subscribedAt: "desc" },
        })

        const header = "Email,Source,Subscribed At"
        const rows = subscribers.map((s) => {
            const subscribedDate = new Date(s.subscribedAt).toISOString()
            const source = s.source ? `"${s.source.replace(/"/g, '""')}"` : ""
            return `${s.email},${source},${subscribedDate}`
        })

        const csv = [header, ...rows].join("\n")

        await logActivity(
            session.user.id,
            "EXPORT_NEWSLETTER_CSV",
            "NewsletterSubscriber",
            undefined,
            { count: subscribers.length }
        )

        return { csv }
    } catch (error) {
        console.error("CSV export failed:", error)
        return { error: "Failed to export subscribers" }
    }
}
