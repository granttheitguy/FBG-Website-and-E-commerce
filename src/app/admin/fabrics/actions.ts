"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { fabricInventorySchema } from "@/lib/validation-schemas"

export async function createFabric(formData: {
    name: string
    type: string
    color?: string
    pattern?: string
    quantityYards: number
    minStockLevel?: number
    costPerYard?: number
    supplierId?: string
    location?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = fabricInventorySchema.safeParse(formData)
    if (!result.success) {
        return { error: "Validation failed", details: result.error.flatten().fieldErrors }
    }

    try {
        const data = result.data

        const fabric = await prisma.fabricInventory.create({
            data: {
                name: data.name,
                type: data.type,
                color: data.color || null,
                pattern: data.pattern || null,
                quantityYards: data.quantityYards,
                minStockLevel: data.minStockLevel,
                costPerYard: data.costPerYard ?? null,
                supplierId: data.supplierId || null,
                location: data.location || null,
                notes: data.notes || null,
            },
        })

        await logActivity(
            session.user.id,
            "CREATE_FABRIC",
            "FABRIC",
            fabric.id,
            { name: fabric.name }
        )

        revalidatePath("/admin/fabrics")
        return { success: true, fabricId: fabric.id }
    } catch (err) {
        console.error("Failed to create fabric:", err)
        return { error: "Failed to create fabric" }
    }
}

export async function updateFabric(
    fabricId: string,
    formData: {
        name?: string
        type?: string
        color?: string
        pattern?: string
        quantityYards?: number
        minStockLevel?: number
        costPerYard?: number
        supplierId?: string
        location?: string
        notes?: string
        isAvailable?: boolean
    }
) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = fabricInventorySchema.partial().safeParse(formData)
    if (!result.success) {
        return { error: "Validation failed", details: result.error.flatten().fieldErrors }
    }

    try {
        const existing = await prisma.fabricInventory.findUnique({ where: { id: fabricId } })
        if (!existing) {
            return { error: "Fabric not found" }
        }

        const data = result.data
        const updateData: Record<string, unknown> = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.type !== undefined) updateData.type = data.type
        if (data.color !== undefined) updateData.color = data.color || null
        if (data.pattern !== undefined) updateData.pattern = data.pattern || null
        if (data.quantityYards !== undefined) updateData.quantityYards = data.quantityYards
        if (data.minStockLevel !== undefined) updateData.minStockLevel = data.minStockLevel
        if (data.costPerYard !== undefined) updateData.costPerYard = data.costPerYard ?? null
        if (data.supplierId !== undefined) updateData.supplierId = data.supplierId || null
        if (data.location !== undefined) updateData.location = data.location || null
        if (data.notes !== undefined) updateData.notes = data.notes || null
        if (formData.isAvailable !== undefined) updateData.isAvailable = formData.isAvailable

        await prisma.fabricInventory.update({
            where: { id: fabricId },
            data: updateData,
        })

        await logActivity(
            session.user.id,
            "UPDATE_FABRIC",
            "FABRIC",
            fabricId,
            { name: existing.name }
        )

        revalidatePath("/admin/fabrics")
        revalidatePath(`/admin/fabrics/${fabricId}`)
        return { success: true }
    } catch (err) {
        console.error("Failed to update fabric:", err)
        return { error: "Failed to update fabric" }
    }
}

export async function deleteFabric(fabricId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const fabric = await prisma.fabricInventory.findUnique({ where: { id: fabricId } })
        if (!fabric) {
            return { error: "Fabric not found" }
        }

        await prisma.fabricInventory.delete({ where: { id: fabricId } })

        await logActivity(
            session.user.id,
            "DELETE_FABRIC",
            "FABRIC",
            fabricId,
            { name: fabric.name }
        )

        revalidatePath("/admin/fabrics")
        return { success: true }
    } catch (err) {
        console.error("Failed to delete fabric:", err)
        return { error: "Failed to delete fabric" }
    }
}
