import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"

export async function GET(req: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const stage = searchParams.get("stage")
        const assignee = searchParams.get("assignee")
        const search = searchParams.get("search")
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (status && status !== "ALL") {
            where.status = status
        }

        if (stage && stage !== "ALL") {
            where.stage = stage
        }

        if (assignee) {
            where.assignedToId = assignee
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { bespokeOrder: { orderNumber: { contains: search, mode: "insensitive" } } },
                { bespokeOrder: { customerName: { contains: search, mode: "insensitive" } } },
            ]
        }

        const [tasks, total] = await Promise.all([
            prisma.productionTask.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
                include: {
                    assignedTo: { select: { id: true, name: true } },
                    bespokeOrder: {
                        select: {
                            id: true,
                            orderNumber: true,
                            customerName: true,
                            status: true,
                        },
                    },
                },
            }),
            prisma.productionTask.count({ where }),
        ])

        // Get status counts
        const statusCounts = await prisma.productionTask.groupBy({
            by: ["status"],
            _count: { _all: true },
        })

        const countsMap: Record<string, number> = {}
        statusCounts.forEach((sc) => {
            countsMap[sc.status] = sc._count._all
        })

        return NextResponse.json({
            tasks: tasks.map((t) => ({
                ...t,
                dueDate: t.dueDate?.toISOString() ?? null,
                completedAt: t.completedAt?.toISOString() ?? null,
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString(),
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
            statusCounts: countsMap,
        })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
