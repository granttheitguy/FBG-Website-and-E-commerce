import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { error } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const segment = searchParams.get("segment") || ""
        const tag = searchParams.get("tag") || ""
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
        const limit = 20
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            role: "CUSTOMER",
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { profile: { phone: { contains: search } } },
            ]
        }

        if (segment) {
            where.segmentMemberships = {
                some: { segmentId: segment },
            }
        }

        if (tag) {
            where.tagAssignments = {
                some: { tagId: tag },
            }
        }

        const [customers, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    profile: {
                        select: { phone: true },
                    },
                    _count: {
                        select: { orders: true },
                    },
                    orders: {
                        select: {
                            total: true,
                            placedAt: true,
                        },
                        orderBy: { placedAt: "desc" },
                        take: 1,
                    },
                    segmentMemberships: {
                        select: {
                            segment: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true,
                                },
                            },
                        },
                    },
                    tagAssignments: {
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ])

        // Calculate total spend per customer
        const customerIds = customers.map((c) => c.id)
        const spendData = await prisma.order.groupBy({
            by: ["userId"],
            where: {
                userId: { in: customerIds },
                paymentStatus: "PAID",
            },
            _sum: { total: true },
        })

        const spendMap = new Map(
            spendData.map((s) => [s.userId, s._sum.total || 0])
        )

        const formatted = customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.profile?.phone || null,
            orderCount: customer._count.orders,
            totalSpent: spendMap.get(customer.id) || 0,
            lastOrderDate: customer.orders[0]?.placedAt || null,
            segments: customer.segmentMemberships.map((m) => m.segment),
            tags: customer.tagAssignments.map((a) => a.tag),
            createdAt: customer.createdAt,
        }))

        return NextResponse.json({
            customers: formatted,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
