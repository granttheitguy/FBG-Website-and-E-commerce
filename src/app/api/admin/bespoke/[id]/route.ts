import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { bespokeOrderSchema } from "@/lib/validation-schemas"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params

        const order = await prisma.bespokeOrder.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                measurement: {
                    select: {
                        id: true,
                        label: true,
                        chest: true,
                        shoulder: true,
                        sleeveLength: true,
                        neck: true,
                        backLength: true,
                        waist: true,
                        hip: true,
                        inseam: true,
                        outseam: true,
                        thigh: true,
                        height: true,
                        weight: true,
                    },
                },
                tasks: {
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                    include: {
                        assignedTo: { select: { id: true, name: true } },
                    },
                },
                statusLogs: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        changedBy: { select: { id: true, name: true } },
                    },
                },
            },
        })

        if (!order) {
            return NextResponse.json({ error: "Bespoke order not found" }, { status: 404 })
        }

        // Serialize dates
        const serialized = {
            ...order,
            estimatedCompletionDate: order.estimatedCompletionDate?.toISOString() ?? null,
            actualCompletionDate: order.actualCompletionDate?.toISOString() ?? null,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            tasks: order.tasks.map((t) => ({
                ...t,
                dueDate: t.dueDate?.toISOString() ?? null,
                completedAt: t.completedAt?.toISOString() ?? null,
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString(),
            })),
            statusLogs: order.statusLogs.map((log) => ({
                ...log,
                createdAt: log.createdAt.toISOString(),
            })),
        }

        return NextResponse.json(serialized)
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params
        const body = await req.json()

        const result = bespokeOrderSchema.partial().safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const existing = await prisma.bespokeOrder.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: "Bespoke order not found" }, { status: 404 })
        }

        const data = result.data
        const updateData: Record<string, unknown> = {}

        if (data.customerName !== undefined) updateData.customerName = data.customerName
        if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail || null
        if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone
        if (data.userId !== undefined) updateData.userId = data.userId || null
        if (data.measurementId !== undefined) updateData.measurementId = data.measurementId || null
        if (data.designDescription !== undefined) updateData.designDescription = data.designDescription || null
        if (data.estimatedPrice !== undefined) updateData.estimatedPrice = data.estimatedPrice ?? null
        if (data.finalPrice !== undefined) updateData.finalPrice = data.finalPrice ?? null
        if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount ?? null
        if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes || null
        if (data.customerNotes !== undefined) updateData.customerNotes = data.customerNotes || null
        if (data.fabricDetails !== undefined) {
            updateData.fabricDetails = data.fabricDetails || null
        }
        if (data.estimatedCompletionDate !== undefined) {
            updateData.estimatedCompletionDate = data.estimatedCompletionDate
                ? new Date(data.estimatedCompletionDate)
                : null
        }
        if (body.depositPaid !== undefined) updateData.depositPaid = Boolean(body.depositPaid)

        const updated = await prisma.bespokeOrder.update({
            where: { id },
            data: updateData,
        })

        await logActivity(
            session!.user.id,
            "UPDATE_BESPOKE_ORDER",
            "BESPOKE_ORDER",
            id,
            { orderNumber: updated.orderNumber }
        )

        return NextResponse.json(updated)
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const { id } = await params

        const order = await prisma.bespokeOrder.findUnique({ where: { id } })
        if (!order) {
            return NextResponse.json({ error: "Bespoke order not found" }, { status: 404 })
        }

        // Prevent deleting delivered orders
        if (order.status === "DELIVERED") {
            return NextResponse.json(
                { error: "Cannot delete a delivered bespoke order" },
                { status: 400 }
            )
        }

        await prisma.bespokeOrder.delete({ where: { id } })

        await logActivity(
            session!.user.id,
            "DELETE_BESPOKE_ORDER",
            "BESPOKE_ORDER",
            id,
            { orderNumber: order.orderNumber }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
