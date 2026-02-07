import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"

export async function GET(req: Request) {
    const { error } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") as ReturnStatus | null

        const where: Record<string, unknown> = {}
        if (status && ["PENDING", "APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
            where.status = status
        }

        const returns = await prisma.returnRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json(returns)
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
