"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { createNotification } from "@/lib/notifications"
import { revalidatePath } from "next/cache"
import {
    bespokeStatusUpdateSchema,
    productionTaskSchema,
    productionTaskStatusSchema,
} from "@/lib/validation-schemas"
import { BESPOKE_STATUS_LABELS, type BespokeOrderStatus } from "@/types/erp"

export async function advanceBespokeStatus(
    orderId: string,
    formData: { status: string; note?: string }
) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = bespokeStatusUpdateSchema.safeParse(formData)
    if (!result.success) {
        return { error: "Validation failed", details: result.error.flatten().fieldErrors }
    }

    try {
        const order = await prisma.bespokeOrder.findUnique({ where: { id: orderId } })
        if (!order) {
            return { error: "Bespoke order not found" }
        }

        const oldStatus = order.status
        const { status: newStatus, note } = result.data

        if (oldStatus === newStatus) {
            return { error: "Order is already in this status" }
        }

        await prisma.$transaction(async (tx) => {
            await tx.bespokeOrder.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    ...(newStatus === "DELIVERED" ? { actualCompletionDate: new Date() } : {}),
                },
            })

            await tx.bespokeStatusLog.create({
                data: {
                    bespokeOrderId: orderId,
                    changedByUserId: session.user.id,
                    oldStatus,
                    newStatus,
                    note: note || null,
                },
            })
        })

        await logActivity(
            session.user.id,
            "UPDATE_BESPOKE_STATUS",
            "BESPOKE_ORDER",
            orderId,
            { orderNumber: order.orderNumber, from: oldStatus, to: newStatus }
        )

        // Notify the customer about the status change (fire-and-forget)
        if (order.userId) {
            const newStatusLabel =
                BESPOKE_STATUS_LABELS[newStatus as BespokeOrderStatus] ?? newStatus
            createNotification(
                order.userId,
                "Bespoke Order Updated",
                `Your bespoke order #${order.orderNumber} has been updated to ${newStatusLabel}.`,
                "BESPOKE",
                `/account/orders`
            )
        }

        revalidatePath(`/admin/bespoke/${orderId}`)
        revalidatePath("/admin/bespoke")
        return { success: true }
    } catch (err) {
        console.error("Failed to advance bespoke status:", err)
        return { error: "Failed to update status" }
    }
}

export async function createProductionTask(formData: {
    bespokeOrderId: string
    title: string
    description?: string
    stage: string
    assignedToId?: string
    priority?: number
    estimatedHours?: number
    dueDate?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = productionTaskSchema.safeParse(formData)
    if (!result.success) {
        return { error: "Validation failed", details: result.error.flatten().fieldErrors }
    }

    try {
        const order = await prisma.bespokeOrder.findUnique({
            where: { id: formData.bespokeOrderId },
        })
        if (!order) {
            return { error: "Bespoke order not found" }
        }

        const data = result.data

        const maxSort = await prisma.productionTask.aggregate({
            where: { bespokeOrderId: data.bespokeOrderId },
            _max: { sortOrder: true },
        })

        const task = await prisma.productionTask.create({
            data: {
                bespokeOrderId: data.bespokeOrderId,
                title: data.title,
                description: data.description || null,
                stage: data.stage,
                status: "NOT_STARTED",
                assignedToId: data.assignedToId || null,
                priority: data.priority ?? 0,
                sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
                estimatedHours: data.estimatedHours ?? null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                notes: data.notes || null,
            },
        })

        await logActivity(
            session.user.id,
            "CREATE_PRODUCTION_TASK",
            "PRODUCTION_TASK",
            task.id,
            { title: task.title, orderNumber: order.orderNumber }
        )

        revalidatePath(`/admin/bespoke/${data.bespokeOrderId}`)
        revalidatePath("/admin/production")
        return { success: true, taskId: task.id }
    } catch (err) {
        console.error("Failed to create production task:", err)
        return { error: "Failed to create task" }
    }
}

export async function updateProductionTask(
    taskId: string,
    formData: {
        status?: string
        title?: string
        description?: string
        stage?: string
        assignedToId?: string
        priority?: number
        estimatedHours?: number
        actualHours?: number
        dueDate?: string
        notes?: string
    }
) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const existing = await prisma.productionTask.findUnique({
            where: { id: taskId },
        })
        if (!existing) {
            return { error: "Task not found" }
        }

        const updateData: Record<string, unknown> = {}

        if (formData.status !== undefined) {
            const statusResult = productionTaskStatusSchema.safeParse({
                status: formData.status,
                actualHours: formData.actualHours,
                notes: formData.notes,
            })
            if (!statusResult.success) {
                return { error: "Invalid status", details: statusResult.error.flatten().fieldErrors }
            }
            updateData.status = statusResult.data.status

            if (statusResult.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
                updateData.completedAt = new Date()
            } else if (statusResult.data.status !== "COMPLETED") {
                updateData.completedAt = null
            }
        }

        if (formData.title !== undefined) updateData.title = formData.title
        if (formData.description !== undefined) updateData.description = formData.description || null
        if (formData.stage !== undefined) updateData.stage = formData.stage
        if (formData.assignedToId !== undefined) updateData.assignedToId = formData.assignedToId || null
        if (formData.priority !== undefined) updateData.priority = formData.priority
        if (formData.estimatedHours !== undefined) updateData.estimatedHours = formData.estimatedHours ?? null
        if (formData.actualHours !== undefined) updateData.actualHours = formData.actualHours ?? null
        if (formData.dueDate !== undefined) {
            updateData.dueDate = formData.dueDate ? new Date(formData.dueDate) : null
        }
        if (formData.notes !== undefined) updateData.notes = formData.notes || null

        await prisma.productionTask.update({
            where: { id: taskId },
            data: updateData,
        })

        await logActivity(
            session.user.id,
            "UPDATE_PRODUCTION_TASK",
            "PRODUCTION_TASK",
            taskId,
            { title: existing.title }
        )

        revalidatePath(`/admin/bespoke/${existing.bespokeOrderId}`)
        revalidatePath("/admin/production")
        return { success: true }
    } catch (err) {
        console.error("Failed to update production task:", err)
        return { error: "Failed to update task" }
    }
}

export async function deleteProductionTask(taskId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const task = await prisma.productionTask.findUnique({ where: { id: taskId } })
        if (!task) {
            return { error: "Task not found" }
        }

        await prisma.productionTask.delete({ where: { id: taskId } })

        await logActivity(
            session.user.id,
            "DELETE_PRODUCTION_TASK",
            "PRODUCTION_TASK",
            taskId,
            { title: task.title }
        )

        revalidatePath(`/admin/bespoke/${task.bespokeOrderId}`)
        revalidatePath("/admin/production")
        return { success: true }
    } catch (err) {
        console.error("Failed to delete production task:", err)
        return { error: "Failed to delete task" }
    }
}
