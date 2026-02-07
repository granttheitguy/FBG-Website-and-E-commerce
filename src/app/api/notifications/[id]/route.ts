import { requireAuth } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * PATCH /api/notifications/[id]
 * Mark a single notification as read. Only the owner can mark it.
 */
export async function PATCH(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth()
    if (error) return error

    const { id } = await params

    const notification = await prisma.notification.findUnique({
        where: { id },
        select: { userId: true },
    })

    if (!notification) {
        return NextResponse.json(
            { error: "Notification not found" },
            { status: 404 }
        )
    }

    if (notification.userId !== session!.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    })

    return NextResponse.json({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
    })
}

/**
 * DELETE /api/notifications/[id]
 * Delete a single notification. Only the owner can delete it.
 */
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth()
    if (error) return error

    const { id } = await params

    const notification = await prisma.notification.findUnique({
        where: { id },
        select: { userId: true },
    })

    if (!notification) {
        return NextResponse.json(
            { error: "Notification not found" },
            { status: 404 }
        )
    }

    if (notification.userId !== session!.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ deleted: true })
}
