import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id } = await params

        const customer = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                profile: {
                    select: {
                        phone: true,
                        defaultShippingAddress: true,
                        notes: true,
                    },
                },
                orders: {
                    orderBy: { placedAt: "desc" },
                    take: 10,
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        paymentStatus: true,
                        total: true,
                        currency: true,
                        placedAt: true,
                        items: {
                            select: {
                                nameSnapshot: true,
                                quantity: true,
                                unitPrice: true,
                                totalPrice: true,
                            },
                        },
                    },
                },
                measurements: {
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        label: true,
                        chest: true,
                        shoulder: true,
                        sleeveLength: true,
                        neck: true,
                        backLength: true,
                        waist: true,
                        hip: true,
                        inseam: true,
                        outseam: true,
                        thigh: true,
                        height: true,
                        weight: true,
                        notes: true,
                        measuredBy: true,
                        measuredAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                customerInteractions: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    select: {
                        id: true,
                        type: true,
                        subject: true,
                        description: true,
                        metadata: true,
                        createdAt: true,
                        staff: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                tickets: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        subject: true,
                        status: true,
                        priority: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                customerNotes: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        note: true,
                        createdAt: true,
                        createdBy: {
                            select: { name: true },
                        },
                    },
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
                _count: {
                    select: {
                        orders: true,
                        tickets: true,
                    },
                },
            },
        })

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            )
        }

        // Calculate total spend
        const spendAgg = await prisma.order.aggregate({
            where: {
                userId: id,
                paymentStatus: "PAID",
            },
            _sum: { total: true },
            _avg: { total: true },
        })

        return NextResponse.json({
            ...customer,
            segments: customer.segmentMemberships.map((m) => m.segment),
            tags: customer.tagAssignments.map((a) => a.tag),
            totalSpent: spendAgg._sum.total || 0,
            averageOrderValue: spendAgg._avg.total || 0,
        })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
