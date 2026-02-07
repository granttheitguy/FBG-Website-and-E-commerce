import { requireRole } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const stockAdjustmentSchema = z.object({
    productVariantId: z.string().min(1, "Variant is required"),
    type: z.enum(["ADJUSTMENT", "SALE", "RETURN", "RESTOCK"]),
    quantity: z.number().int().refine(val => val !== 0, "Quantity cannot be zero"),
    reason: z.string().min(1, "Reason is required").max(500),
})

export async function GET(request: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const lowStock = searchParams.get("lowStock") === "true"

    try {
        const variants = await prisma.productVariant.findMany({
            where: {
                OR: search ? [
                    { sku: { contains: search } },
                    { product: { name: { contains: search } } }
                ] : undefined,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        status: true
                    }
                },
                stockMovements: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Filter by low stock if requested
        const filteredVariants = lowStock
            ? variants.filter(v => v.stockQty <= 5)
            : variants

        return NextResponse.json({ success: true, data: filteredVariants })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch inventory" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const body = await request.json()
        const validation = stockAdjustmentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    errors: validation.error.issues.map((e: any) => ({
                        field: e.path.join("."),
                        message: e.message
                    }))
                },
                { status: 400 }
            )
        }

        const { productVariantId, type, quantity, reason } = validation.data

        // Check if variant exists
        const variant = await prisma.productVariant.findUnique({
            where: { id: productVariantId },
            include: {
                product: {
                    select: { name: true }
                }
            }
        })

        if (!variant) {
            return NextResponse.json(
                { success: false, error: "Product variant not found" },
                { status: 404 }
            )
        }

        // Calculate new stock quantity
        const newStockQty = variant.stockQty + quantity

        if (newStockQty < 0) {
            return NextResponse.json(
                { success: false, error: "Insufficient stock for this adjustment" },
                { status: 400 }
            )
        }

        // Use transaction to update stock and create movement record
        const result = await prisma.$transaction(async (tx) => {
            // Create stock movement record
            const movement = await tx.stockMovement.create({
                data: {
                    productVariantId,
                    type,
                    quantity,
                    reason,
                    createdByUserId: session!.user.id,
                }
            })

            // Update variant stock quantity
            const updatedVariant = await tx.productVariant.update({
                where: { id: productVariantId },
                data: { stockQty: newStockQty }
            })

            return { movement, updatedVariant }
        })

        await logActivity(
            session!.user.id,
            "STOCK_ADJUSTMENT",
            "productVariant",
            productVariantId,
            {
                type,
                quantity,
                newStockQty,
                productName: variant.product.name,
                sku: variant.sku
            }
        )

        return NextResponse.json(
            { success: true, data: result },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to create stock adjustment" },
            { status: 500 }
        )
    }
}
