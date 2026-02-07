import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            name,
            slug,
            descriptionShort,
            descriptionLong,
            basePrice,
            status,
            isNew,
            isFeatured,
            images,
            variants
        } = body

        // Transaction to update product
        const product = await prisma.$transaction(async (tx) => {
            // Update basic info
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    name,
                    slug,
                    descriptionShort,
                    descriptionLong,
                    basePrice,
                    status,
                    isNew,
                    isFeatured,
                }
            })

            // Update Images (Delete all and recreate for simplicity)
            if (images) {
                await tx.productImage.deleteMany({ where: { productId: id } })
                if (images.length > 0) {
                    await tx.productImage.createMany({
                        data: images.map((url: string, index: number) => ({
                            productId: id,
                            imageUrl: url,
                            altText: name,
                            sortOrder: index
                        }))
                    })
                }
            }

            // Update Variants (Delete all and recreate for simplicity - careful with order history references if not handled by DB constraints, but OrderItem stores snapshots so it's okay)
            // Actually, deleting variants might break integrity if we had strict foreign keys without snapshots, but we use snapshots.
            // However, to be safe and cleaner, let's try to upsert or just replace. Replacing is easiest for this MVP.
            if (variants) {
                await tx.productVariant.deleteMany({ where: { productId: id } })
                if (variants.length > 0) {
                    await tx.productVariant.createMany({
                        data: variants.map((variant: any) => ({
                            productId: id,
                            size: variant.size,
                            stockQty: variant.stockQty,
                            priceOverride: variant.priceOverride
                        }))
                    })
                }
            }

            return updatedProduct
        })

        await logActivity(session.user.id, "UPDATE_PRODUCT", "PRODUCT", product.id, { name: product.name })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if product has orders
        const product = await prisma.product.findUnique({
            where: { id },
            include: { _count: { select: { orderItems: true } } }
        })

        if (product && product._count.orderItems > 0) {
            // Soft delete or prevent delete
            // For now, let's just set status to ARCHIVED if we had that, or just prevent it.
            // Let's prevent it and tell user to archive it.
            return NextResponse.json({ error: "Cannot delete product with existing orders. Please set status to Inactive instead." }, { status: 400 })
        }

        await prisma.product.delete({
            where: { id }
        })

        await logActivity(session.user.id, "DELETE_PRODUCT", "PRODUCT", id)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
