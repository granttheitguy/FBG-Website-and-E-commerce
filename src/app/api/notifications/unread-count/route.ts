import { requireAuth } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * GET /api/notifications/unread-count
 * Return the number of unread notifications for the authenticated user.
 */
export async function GET() {
    const { error, session } = await requireAuth()
    if (error) return error

    const count = await prisma.notification.count({
        where: {
            userId: session!.user.id,
            isRead: false,
        },
    })

    return NextResponse.json({ count })
}
