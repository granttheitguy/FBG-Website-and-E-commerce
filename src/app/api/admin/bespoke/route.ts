import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { bespokeOrderSchema } from "@/lib/validation-schemas"
import { generateBespokeOrderNumber } from "@/lib/utils"

export async function GET(req: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const search = searchParams.get("search")
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (status && status !== "ALL") {
            where.status = status
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { customerName: { contains: search, mode: "insensitive" } },
                { customerEmail: { contains: search, mode: "insensitive" } },
                { customerPhone: { contains: search } },
            ]
        }

        const [orders, total] = await Promise.all([
            prisma.bespokeOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    _count: { select: { tasks: true } },
                },
            }),
            prisma.bespokeOrder.count({ where }),
        ])

        // Get status counts for filter tabs
        const statusCounts = await prisma.bespokeOrder.groupBy({
            by: ["status"],
            _count: { _all: true },
        })

        const countsMap: Record<string, number> = {}
        statusCounts.forEach((sc) => {
            countsMap[sc.status] = sc._count._all
        })

        return NextResponse.json({
            orders: orders.map((order) => ({
                ...order,
                estimatedCompletionDate: order.estimatedCompletionDate?.toISOString() ?? null,
                actualCompletionDate: order.actualCompletionDate?.toISOString() ?? null,
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString(),
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

export async function POST(req: Request) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const body = await req.json()
        const result = bespokeOrderSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const data = result.data
        const orderNumber = generateBespokeOrderNumber()

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.bespokeOrder.create({
                data: {
                    orderNumber,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail || null,
                    customerPhone: data.customerPhone,
                    userId: data.userId || null,
                    measurementId: data.measurementId || null,
                    designDescription: data.designDescription || null,
                    estimatedPrice: data.estimatedPrice ?? null,
                    finalPrice: data.finalPrice ?? null,
                    depositAmount: data.depositAmount ?? null,
                    fabricDetails: data.fabricDetails || null,
                    estimatedCompletionDate: data.estimatedCompletionDate
                        ? new Date(data.estimatedCompletionDate)
                        : null,
                    internalNotes: data.internalNotes || null,
                    customerNotes: data.customerNotes || null,
                    status: "INQUIRY",
                },
            })

            // Create initial status log
            await tx.bespokeStatusLog.create({
                data: {
                    bespokeOrderId: newOrder.id,
                    changedByUserId: session!.user.id,
                    oldStatus: "",
                    newStatus: "INQUIRY",
                    note: "Order created",
                },
            })

            return newOrder
        })

        await logActivity(
            session!.user.id,
            "CREATE_BESPOKE_ORDER",
            "BESPOKE_ORDER",
            order.id,
            { orderNumber: order.orderNumber, customerName: order.customerName }
        )

        return NextResponse.json(order, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
