import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED"

export async function GET(req: Request) {
    const { error } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") as ReviewStatus | null

        const where: Record<string, unknown> = {}
        if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
            where.status = status
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: { id: true, name: true, slug: true },
                },
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        })

        return NextResponse.json(reviews)
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
