"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"

export async function updateStoreSettings(formData: FormData) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return { error: "Unauthorized" }
        }

        const id = formData.get("id") as string
        const storeName = formData.get("storeName") as string
        const storeEmail = formData.get("storeEmail") as string || null
        const storePhone = formData.get("storePhone") as string || null
        const whatsappNumber = formData.get("whatsappNumber") as string || null
        const storeAddress = formData.get("storeAddress") as string || null
        const logoUrl = formData.get("logoUrl") as string || null
        const currency = formData.get("currency") as string

        // Build social links JSON
        const socialLinks = JSON.stringify({
            instagram: formData.get("instagram") || null,
            facebook: formData.get("facebook") || null,
            twitter: formData.get("twitter") || null,
            tiktok: formData.get("tiktok") || null,
        })

        await prisma.storeSettings.update({
            where: { id },
            data: {
                storeName,
                storeEmail,
                storePhone,
                whatsappNumber,
                storeAddress,
                logoUrl,
                socialLinks,
                currency,
            }
        })

        await logActivity(
            session.user.id,
            "Updated store settings",
            "STORE_SETTINGS",
            id
        )

        revalidatePath("/super-admin/store-settings")

        return { success: true }
    } catch (error) {
        console.error("Failed to update store settings:", error)
        return { error: "Failed to update settings. Please try again." }
    }
}
