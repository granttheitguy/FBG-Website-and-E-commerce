import { requireAuth } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const PAGE_SIZE = 20

/**
 * GET /api/notifications
 * List the current user's notifications, paginated (newest first).
 * Accepts ?page=1 query parameter.
 */
export async function GET(request: Request) {
    const { error, session } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const skip = (page - 1) * PAGE_SIZE

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where: { userId: session!.user.id },
            orderBy: { createdAt: "desc" },
            skip,
            take: PAGE_SIZE,
        }),
        prisma.notification.count({
            where: { userId: session!.user.id },
        }),
    ])

    return NextResponse.json({
        notifications: notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
    })
}

/**
 * PATCH /api/notifications
 * Mark all of the current user's unread notifications as read.
 */
export async function PATCH() {
    const { error, session } = await requireAuth()
    if (error) return error

    const result = await prisma.notification.updateMany({
        where: {
            userId: session!.user.id,
            isRead: false,
        },
        data: { isRead: true },
    })

    return NextResponse.json({ updated: result.count })
}
