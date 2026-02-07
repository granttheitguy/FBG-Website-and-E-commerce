"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { shippingZoneSchema, shippingRateSchema } from "@/lib/validation-schemas"
import { revalidatePath } from "next/cache"

// ============================================
// Shipping Zone Server Actions
// ============================================

export async function createShippingZone(formData: FormData) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    const raw = {
        name: formData.get("name") as string,
        states: formData.get("states") as string,
        isActive: formData.get("isActive") === "true",
    }

    const validation = shippingZoneSchema.safeParse(raw)
    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        }
    }

    const data = validation.data

    // Validate that states is a valid JSON array and parse for Prisma Json field
    let statesArray: string[]
    try {
        const parsed = JSON.parse(data.states)
        if (!Array.isArray(parsed)) {
            return { success: false, message: "States must be a JSON array" }
        }
        statesArray = parsed
    } catch {
        return { success: false, message: "States must be valid JSON" }
    }

    try {
        const zone = await prisma.shippingZone.create({
            data: {
                name: data.name,
                states: JSON.stringify(statesArray),
                isActive: data.isActive,
            },
        })

        await logActivity(session.user.id, "CREATE_SHIPPING_ZONE", "ShippingZone", zone.id, { name: data.name })
        revalidatePath("/admin/shipping")

        return { success: true, message: "Shipping zone created" }
    } catch (error) {
        console.error("Create shipping zone error:", error)
        return { success: false, message: "Failed to create shipping zone" }
    }
}

export async function updateShippingZone(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    const raw = {
        name: formData.get("name") as string,
        states: formData.get("states") as string,
        isActive: formData.get("isActive") === "true",
    }

    const validation = shippingZoneSchema.safeParse(raw)
    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        }
    }

    const data = validation.data

    let statesArray: string[]
    try {
        const parsed = JSON.parse(data.states)
        if (!Array.isArray(parsed)) {
            return { success: false, message: "States must be a JSON array" }
        }
        statesArray = parsed
    } catch {
        return { success: false, message: "States must be valid JSON" }
    }

    try {
        await prisma.shippingZone.update({
            where: { id },
            data: {
                name: data.name,
                states: JSON.stringify(statesArray),
                isActive: data.isActive,
            },
        })

        await logActivity(session.user.id, "UPDATE_SHIPPING_ZONE", "ShippingZone", id, { name: data.name })
        revalidatePath("/admin/shipping")

        return { success: true, message: "Shipping zone updated" }
    } catch (error) {
        console.error("Update shipping zone error:", error)
        return { success: false, message: "Failed to update shipping zone" }
    }
}

export async function deleteShippingZone(id: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    try {
        await prisma.shippingZone.delete({ where: { id } })

        await logActivity(session.user.id, "DELETE_SHIPPING_ZONE", "ShippingZone", id)
        revalidatePath("/admin/shipping")

        return { success: true, message: "Shipping zone deleted" }
    } catch (error) {
        console.error("Delete shipping zone error:", error)
        return { success: false, message: "Failed to delete shipping zone" }
    }
}

// ============================================
// Shipping Rate Server Actions
// ============================================

export async function createShippingRate(formData: FormData) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    const raw = {
        shippingZoneId: formData.get("shippingZoneId") as string,
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
        estimatedDays: formData.get("estimatedDays") as string,
        isActive: formData.get("isActive") === "true",
    }

    const validation = shippingRateSchema.safeParse(raw)
    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        }
    }

    const data = validation.data

    try {
        const rate = await prisma.shippingRate.create({
            data: {
                shippingZoneId: data.shippingZoneId,
                name: data.name,
                price: data.price,
                estimatedDays: data.estimatedDays,
                isActive: data.isActive,
            },
        })

        await logActivity(session.user.id, "CREATE_SHIPPING_RATE", "ShippingRate", rate.id, { name: data.name })
        revalidatePath("/admin/shipping")

        return { success: true, message: "Shipping rate created" }
    } catch (error) {
        console.error("Create shipping rate error:", error)
        return { success: false, message: "Failed to create shipping rate" }
    }
}

export async function updateShippingRate(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    const raw = {
        shippingZoneId: formData.get("shippingZoneId") as string,
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
        estimatedDays: formData.get("estimatedDays") as string,
        isActive: formData.get("isActive") === "true",
    }

    const validation = shippingRateSchema.safeParse(raw)
    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        }
    }

    const data = validation.data

    try {
        await prisma.shippingRate.update({
            where: { id },
            data: {
                shippingZoneId: data.shippingZoneId,
                name: data.name,
                price: data.price,
                estimatedDays: data.estimatedDays,
                isActive: data.isActive,
            },
        })

        await logActivity(session.user.id, "UPDATE_SHIPPING_RATE", "ShippingRate", id, { name: data.name })
        revalidatePath("/admin/shipping")

        return { success: true, message: "Shipping rate updated" }
    } catch (error) {
        console.error("Update shipping rate error:", error)
        return { success: false, message: "Failed to update shipping rate" }
    }
}

export async function deleteShippingRate(id: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    try {
        await prisma.shippingRate.delete({ where: { id } })

        await logActivity(session.user.id, "DELETE_SHIPPING_RATE", "ShippingRate", id)
        revalidatePath("/admin/shipping")

        return { success: true, message: "Shipping rate deleted" }
    } catch (error) {
        console.error("Delete shipping rate error:", error)
        return { success: false, message: "Failed to delete shipping rate" }
    }
}
