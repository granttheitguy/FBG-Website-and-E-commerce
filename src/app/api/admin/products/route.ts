import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { logActivity } from "@/lib/logger"
import { productSchema } from "@/lib/validation-schemas"
import { requireRole } from "@/lib/rbac"

export async function POST(req: Request) {
    // Check authorization
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const body = await req.json()

        // Validate input
        const validatedData = productSchema.parse(body)
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
        } = validatedData

        // Check if slug exists
        const existingProduct = await prisma.product.findUnique({
            where: { slug }
        })

        if (existingProduct) {
            return NextResponse.json({ error: "Product with this slug already exists" }, { status: 400 })
        }

        // Transaction to create product, images, and variants
        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
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

            // Create Images
            if (images && images.length > 0) {
                await tx.productImage.createMany({
                    data: images.map((url: string, index: number) => ({
                        productId: newProduct.id,
                        imageUrl: url,
                        altText: name,
                        sortOrder: index
                    }))
                })
            }

            // Create Variants
            if (variants && variants.length > 0) {
                await tx.productVariant.createMany({
                    data: variants.map((variant: any, index: number) => ({
                        productId: newProduct.id,
                        sku: `${slug}-${variant.size}`.toUpperCase(),
                        size: variant.size,
                        stockQty: variant.stockQty,
                        priceOverride: variant.priceOverride
                    }))
                })
            }

            return newProduct
        })

        await logActivity(session.user.id, "CREATE_PRODUCT", "PRODUCT", product.id, { name: product.name })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
