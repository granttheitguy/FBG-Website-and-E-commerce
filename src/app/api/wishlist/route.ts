import { requireAuth } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const { error, session } = await requireAuth()
        if (error) return error

        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId: session!.user.id },
            include: {
                product: {
                    include: {
                        images: {
                            orderBy: { sortOrder: "asc" },
                            take: 1,
                        },
                        variants: {
                            where: { status: "ACTIVE" },
                            select: {
                                id: true,
                                size: true,
                                stockQty: true,
                                priceOverride: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ items: wishlistItems })
    } catch (err) {

        return NextResponse.json(
            { error: "Failed to fetch wishlist" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const { error, session } = await requireAuth()
        if (error) return error

        const body = await req.json()
        const { productId } = body

        if (!productId || typeof productId !== "string") {
            return NextResponse.json(
                { error: "productId is required" },
                { status: 400 }
            )
        }

        // Verify product exists and is active
        const product = await prisma.product.findFirst({
            where: { id: productId, status: "ACTIVE" },
        })

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            )
        }

        // Upsert to avoid duplicates
        const wishlistItem = await prisma.wishlistItem.upsert({
            where: {
                userId_productId: {
                    userId: session!.user.id,
                    productId,
                },
            },
            update: {},
            create: {
                userId: session!.user.id,
                productId,
            },
        })

        return NextResponse.json({ item: wishlistItem }, { status: 201 })
    } catch (err) {

        return NextResponse.json(
            { error: "Failed to add to wishlist" },
            { status: 500 }
        )
    }
}
