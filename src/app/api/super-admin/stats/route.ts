import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get total revenue from paid orders
        const revenueData = await prisma.order.aggregate({
            where: {
                paymentStatus: "PAID"
            },
            _sum: {
                total: true
            }
        })

        // Get user counts by role
        const userCounts = await prisma.user.groupBy({
            by: ["role"],
            _count: {
                _all: true
            }
        })

        // Get order statistics
        const totalOrders = await prisma.order.count()
        const ordersByStatus = await prisma.order.groupBy({
            by: ["status"],
            _count: {
                _all: true
            }
        })

        // Get ticket statistics
        const totalTickets = await prisma.supportTicket.count()
        const ticketsByStatus = await prisma.supportTicket.groupBy({
            by: ["status"],
            _count: {
                _all: true
            }
        })

        // Format user counts
        const users = {
            total: userCounts.reduce((sum, r) => sum + r._count._all, 0),
            byRole: Object.fromEntries(
                userCounts.map(r => [r.role, r._count._all])
            )
        }

        const stats = {
            revenue: {
                total: revenueData._sum.total || 0,
                currency: "NGN"
            },
            users,
            orders: {
                total: totalOrders,
                byStatus: Object.fromEntries(
                    ordersByStatus.map(o => [o.status, o._count._all])
                )
            },
            tickets: {
                total: totalTickets,
                byStatus: Object.fromEntries(
                    ticketsByStatus.map(t => [t.status, t._count._all])
                )
            },
            systemStatus: "operational"
        }

        return NextResponse.json(stats)
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        )
    }
}
