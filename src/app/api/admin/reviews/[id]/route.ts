import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const body = await req.json()
        const { status } = body

        if (!status || !["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json(
                { error: "Status must be APPROVED or REJECTED" },
                { status: 400 }
            )
        }

        const review = await prisma.review.findUnique({
            where: { id },
        })

        if (!review) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            )
        }

        const updated = await prisma.review.update({
            where: { id },
            data: { status },
        })

        await logActivity(
            session!.user.id,
            `MODERATE_REVIEW_${status}`,
            "Review",
            id,
            { productId: review.productId }
        )

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const review = await prisma.review.findUnique({
            where: { id },
        })

        if (!review) {
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            )
        }

        await prisma.review.delete({
            where: { id },
        })

        await logActivity(
            session!.user.id,
            "DELETE_REVIEW",
            "Review",
            id,
            { productId: review.productId }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
