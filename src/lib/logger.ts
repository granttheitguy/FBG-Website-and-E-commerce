import { prisma } from "@/lib/db"

export async function logActivity(
    userId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: any
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                metadata: metadata ? JSON.stringify(metadata) : undefined,
            },
        })
    } catch (error) {
        console.error("Failed to create activity log:", error)
        // Don't throw, we don't want to break the main flow if logging fails
    }
}
