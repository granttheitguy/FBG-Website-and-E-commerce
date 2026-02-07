"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { stockAdjustmentSchema } from "@/lib/validation-schemas"
import { revalidatePath } from "next/cache"

// ============================================
// Stock Adjustment Server Action
// ============================================

export async function adjustStock(formData: FormData) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { success: false, message: "Unauthorized" }
    }

    const raw = {
        productVariantId: formData.get("productVariantId") as string,
        type: formData.get("type") as string,
        quantity: Number(formData.get("quantity")),
        reason: formData.get("reason") as string,
    }

    const validation = stockAdjustmentSchema.safeParse(raw)
    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors,
        }
    }

    const data = validation.data

    try {
        // Fetch current variant to validate
        const variant = await prisma.productVariant.findUnique({
            where: { id: data.productVariantId },
            include: { product: true },
        })

        if (!variant) {
            return { success: false, message: "Product variant not found" }
        }

        // Calculate new stock quantity
        let newQty: number

        switch (data.type) {
            case "ADDITION":
                newQty = variant.stockQty + data.quantity
                break
            case "DEDUCTION":
                newQty = variant.stockQty - data.quantity
                if (newQty < 0) {
                    return {
                        success: false,
                        message: `Cannot deduct ${data.quantity} units. Current stock is ${variant.stockQty}.`,
                    }
                }
                break
            case "ADJUSTMENT":
                // For ADJUSTMENT, quantity is the new absolute value
                newQty = data.quantity
                break
            default:
                return { success: false, message: "Invalid adjustment type" }
        }

        // Update stock and create movement record in a transaction
        await prisma.$transaction([
            prisma.productVariant.update({
                where: { id: data.productVariantId },
                data: { stockQty: newQty },
            }),
            prisma.stockMovement.create({
                data: {
                    productVariantId: data.productVariantId,
                    type: data.type,
                    quantity: data.type === "ADJUSTMENT" ? Math.abs(newQty - variant.stockQty) : data.quantity,
                    reason: data.reason,
                    createdByUserId: session.user.id,
                },
            }),
        ])

        await logActivity(
            session.user.id,
            "STOCK_ADJUSTMENT",
            "ProductVariant",
            data.productVariantId,
            {
                type: data.type,
                quantity: data.quantity,
                oldQty: variant.stockQty,
                newQty,
                reason: data.reason,
                product: variant.product.name,
                sku: variant.sku,
            }
        )

        revalidatePath("/admin/inventory")

        return { success: true, message: `Stock updated. New quantity: ${newQty}` }
    } catch (error) {
        console.error("Stock adjustment error:", error)
        return { success: false, message: "Failed to adjust stock" }
    }
}
