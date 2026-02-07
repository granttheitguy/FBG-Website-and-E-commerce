import { prisma } from "@/lib/db"

type NotificationType =
    | "ORDER_UPDATE"
    | "PAYMENT"
    | "SUPPORT"
    | "PROMOTION"
    | "SYSTEM"
    | "BESPOKE"
    | "PRODUCTION"

/**
 * Create a single notification for a user.
 * Fire-and-forget: catches errors internally so callers are never blocked.
 */
export async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    linkUrl?: string
): Promise<void> {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                linkUrl: linkUrl ?? null,
            },
        })
    } catch (error) {
        console.error(
            `[notifications] Failed to create notification for user ${userId}:`,
            error
        )
    }
}

/**
 * Create the same notification for multiple users at once.
 * Uses createMany for efficient bulk insertion.
 * Fire-and-forget: catches errors internally so callers are never blocked.
 */
export async function createBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    linkUrl?: string
): Promise<void> {
    if (userIds.length === 0) return

    try {
        await prisma.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                title,
                message,
                type,
                linkUrl: linkUrl ?? null,
            })),
        })
    } catch (error) {
        console.error(
            `[notifications] Failed to create bulk notification for ${userIds.length} users:`,
            error
        )
    }
}
