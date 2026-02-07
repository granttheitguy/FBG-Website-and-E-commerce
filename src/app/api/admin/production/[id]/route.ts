import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { productionTaskStatusSchema } from "@/lib/validation-schemas"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params
        const body = await req.json()

        const result = productionTaskStatusSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const existing = await prisma.productionTask.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: "Production task not found" }, { status: 404 })
        }

        const { status, actualHours, notes } = result.data

        const updateData: Record<string, unknown> = { status }

        if (actualHours !== undefined) updateData.actualHours = actualHours
        if (notes !== undefined) updateData.notes = notes

        // Set completedAt when marking as completed
        if (status === "COMPLETED" && existing.status !== "COMPLETED") {
            updateData.completedAt = new Date()
        } else if (status !== "COMPLETED") {
            updateData.completedAt = null
        }

        // Also allow updating other fields if provided
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description || null
        if (body.stage !== undefined) updateData.stage = body.stage
        if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null
        if (body.priority !== undefined) updateData.priority = body.priority
        if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours ?? null
        if (body.dueDate !== undefined) {
            updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
        }

        const updated = await prisma.productionTask.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: { select: { id: true, name: true } },
                bespokeOrder: {
                    select: {
                        id: true,
                        orderNumber: true,
                        customerName: true,
                        status: true,
                    },
                },
            },
        })

        await logActivity(
            session!.user.id,
            "UPDATE_PRODUCTION_TASK",
            "PRODUCTION_TASK",
            id,
            {
                title: updated.title,
                status,
                orderNumber: updated.bespokeOrder.orderNumber,
            }
        )

        return NextResponse.json({
            ...updated,
            dueDate: updated.dueDate?.toISOString() ?? null,
            completedAt: updated.completedAt?.toISOString() ?? null,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        })
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

        const task = await prisma.productionTask.findUnique({
            where: { id },
            include: {
                bespokeOrder: { select: { orderNumber: true } },
            },
        })

        if (!task) {
            return NextResponse.json({ error: "Production task not found" }, { status: 404 })
        }

        await prisma.productionTask.delete({ where: { id } })

        await logActivity(
            session!.user.id,
            "DELETE_PRODUCTION_TASK",
            "PRODUCTION_TASK",
            id,
            { title: task.title, orderNumber: task.bespokeOrder.orderNumber }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
