"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"

export async function createCoupon(formData: FormData) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return { error: "Unauthorized" }
        }

        const code = (formData.get("code") as string).toUpperCase()
        const type = formData.get("type") as string
        const value = parseFloat(formData.get("value") as string)
        const minOrderAmount = formData.get("minOrderAmount")
            ? parseFloat(formData.get("minOrderAmount") as string)
            : null
        const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string) : null
        const expiresAt = formData.get("expiresAt")
            ? new Date(formData.get("expiresAt") as string)
            : null
        const isActive = formData.get("isActive") === "on"

        // Check if code already exists
        const existing = await prisma.coupon.findUnique({ where: { code } })
        if (existing) {
            return { error: "A coupon with this code already exists" }
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                type,
                value,
                minOrderAmount,
                maxUses,
                expiresAt,
                isActive,
            },
        })

        await logActivity(
            session.user.id,
            `Created coupon: ${code}`,
            "COUPON",
            coupon.id
        )

        revalidatePath("/super-admin/coupons")

        return { success: true }
    } catch (error) {
        console.error("Failed to create coupon:", error)
        return { error: "Failed to create coupon. Please try again." }
    }
}

export async function updateCoupon(formData: FormData) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return { error: "Unauthorized" }
        }

        const id = formData.get("id") as string
        const code = (formData.get("code") as string).toUpperCase()
        const type = formData.get("type") as string
        const value = parseFloat(formData.get("value") as string)
        const minOrderAmount = formData.get("minOrderAmount")
            ? parseFloat(formData.get("minOrderAmount") as string)
            : null
        const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string) : null
        const expiresAt = formData.get("expiresAt")
            ? new Date(formData.get("expiresAt") as string)
            : null
        const isActive = formData.get("isActive") === "on"

        // Check if code is taken by another coupon
        const existing = await prisma.coupon.findUnique({ where: { code } })
        if (existing && existing.id !== id) {
            return { error: "A coupon with this code already exists" }
        }

        await prisma.coupon.update({
            where: { id },
            data: {
                code,
                type,
                value,
                minOrderAmount,
                maxUses,
                expiresAt,
                isActive,
            },
        })

        await logActivity(
            session.user.id,
            `Updated coupon: ${code}`,
            "COUPON",
            id
        )

        revalidatePath("/super-admin/coupons")

        return { success: true }
    } catch (error) {
        console.error("Failed to update coupon:", error)
        return { error: "Failed to update coupon. Please try again." }
    }
}

export async function deleteCoupon(id: string) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return { error: "Unauthorized" }
        }

        const coupon = await prisma.coupon.delete({ where: { id } })

        await logActivity(
            session.user.id,
            `Deleted coupon: ${coupon.code}`,
            "COUPON",
            id
        )

        revalidatePath("/super-admin/coupons")

        return { success: true }
    } catch (error) {
        console.error("Failed to delete coupon:", error)
        return { error: "Failed to delete coupon. Please try again." }
    }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return { error: "Unauthorized" }
        }

        const coupon = await prisma.coupon.update({
            where: { id },
            data: { isActive },
        })

        await logActivity(
            session.user.id,
            `${isActive ? "Activated" : "Deactivated"} coupon: ${coupon.code}`,
            "COUPON",
            id
        )

        revalidatePath("/super-admin/coupons")

        return { success: true }
    } catch (error) {
        console.error("Failed to toggle coupon status:", error)
        return { error: "Failed to update coupon status. Please try again." }
    }
}
