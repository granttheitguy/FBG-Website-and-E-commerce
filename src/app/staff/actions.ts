"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import {
    productionTaskStatusSchema,
    customerInteractionSchema,
} from "@/lib/validation-schemas"
import type { ProductionTaskStatus } from "@/types/erp"

// ----- Update Task Status -----

export async function updateTaskStatus(
    taskId: string,
    status: ProductionTaskStatus,
    notes?: string
): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = productionTaskStatusSchema.safeParse({ status, notes })
    if (!parsed.success) {
        return { error: "Invalid status value" }
    }

    try {
        // Verify task exists and is assigned to the current user
        const task = await prisma.productionTask.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                assignedToId: true,
                bespokeOrderId: true,
                status: true,
            },
        })

        if (!task) {
            return { error: "Task not found" }
        }

        // Staff can only update tasks assigned to them; admins can update any task
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
        if (!isAdmin && task.assignedToId !== session.user.id) {
            return { error: "You can only update tasks assigned to you" }
        }

        const updateData: Record<string, unknown> = {
            status: parsed.data.status,
        }

        if (parsed.data.notes) {
            updateData.notes = parsed.data.notes
        }

        // Set completedAt when task is marked as completed
        if (parsed.data.status === "COMPLETED") {
            updateData.completedAt = new Date()
        }

        // Clear completedAt if moving away from completed
        if (parsed.data.status !== "COMPLETED" && task.status === "COMPLETED") {
            updateData.completedAt = null
        }

        await prisma.productionTask.update({
            where: { id: taskId },
            data: updateData,
        })

        await logActivity(
            session.user.id,
            "UPDATE_TASK_STATUS",
            "ProductionTask",
            taskId,
            { oldStatus: task.status, newStatus: parsed.data.status }
        )

        revalidatePath("/staff/tasks")
        revalidatePath(`/staff/bespoke/${task.bespokeOrderId}`)
        revalidatePath("/staff/dashboard")

        return { success: true }
    } catch (err) {
        console.error("Update task status error:", err)
        return { error: "Failed to update task status" }
    }
}

// ----- Log Customer Interaction -----

export async function logCustomerInteraction(
    customerId: string,
    formData: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerInteractionSchema.safeParse({
        ...formData,
        userId: customerId,
    })
    if (!parsed.success) {
        return { error: "Validation failed. Please check all fields." }
    }

    try {
        // Verify customer exists
        const customer = await prisma.user.findUnique({
            where: { id: customerId },
            select: { id: true },
        })

        if (!customer) {
            return { error: "Customer not found" }
        }

        const data = parsed.data
        const interaction = await prisma.customerInteraction.create({
            data: {
                userId: customerId,
                staffUserId: session.user.id,
                type: data.type,
                subject: data.subject || null,
                description: data.description,
            },
        })

        await logActivity(
            session.user.id,
            "LOG_INTERACTION",
            "CustomerInteraction",
            interaction.id,
            { customerId, type: data.type }
        )

        revalidatePath(`/staff/customers/${customerId}`)
        revalidatePath("/staff/interactions")
        revalidatePath("/staff/dashboard")

        return { success: true }
    } catch (err) {
        console.error("Log interaction error:", err)
        return { error: "Failed to log interaction" }
    }
}
