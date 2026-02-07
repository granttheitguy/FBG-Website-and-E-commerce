import { requireAuth } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { reviewSchema } from "@/lib/validation-schemas"
import { createBulkNotification } from "@/lib/notifications"

export async function POST(req: Request) {
    const { error, session } = await requireAuth()
    if (error) return error

    // Only customers can leave reviews
    if (session!.user.role !== "CUSTOMER") {
        return NextResponse.json(
            { error: "Only customers can submit reviews" },
            { status: 403 }
        )
    }

    try {
        const body = await req.json()

        const result = reviewSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const { productId, rating, title, comment } = result.data
        const userId = session!.user.id

        // Verify the product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            )
        }

        // Check if user has already reviewed this product
        const existingReview = await prisma.review.findUnique({
            where: {
                productId_userId: {
                    productId,
                    userId,
                },
            },
        })

        if (existingReview) {
            return NextResponse.json(
                { error: "You have already reviewed this product" },
                { status: 409 }
            )
        }

        // Verify user has purchased this product (check for delivered orders)
        const hasPurchased = await prisma.orderItem.findFirst({
            where: {
                productId,
                order: {
                    userId,
                    status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] },
                },
            },
        })

        if (!hasPurchased) {
            return NextResponse.json(
                { error: "You must purchase this product before leaving a review" },
                { status: 403 }
            )
        }

        // Create the review with PENDING status
        const review = await prisma.review.create({
            data: {
                productId,
                userId,
                rating,
                title: title || null,
                comment: comment || null,
                status: "PENDING",
            },
            include: {
                user: {
                    select: { name: true }
                }
            }
        })

        // Notify all admins and staff about the new pending review
        const adminUsers = await prisma.user.findMany({
            where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
            select: { id: true }
        })

        await createBulkNotification(
            adminUsers.map(a => a.id),
            "New Review Pending Approval",
            `${review.user.name} submitted a ${rating}-star review for ${product.name}`,
            "SYSTEM",
            "/admin/reviews"
        )

        return NextResponse.json(review, { status: 201 })
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
