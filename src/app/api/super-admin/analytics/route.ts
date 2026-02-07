import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Revenue by day (last 30 days)
        const orders = await prisma.order.findMany({
            where: {
                paymentStatus: "PAID",
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                total: true,
                createdAt: true
            }
        })

        // Group by date
        const revenueByDate = new Map<string, number>()
        const orderCountByDate = new Map<string, number>()

        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0]
            revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + order.total)
            orderCountByDate.set(dateKey, (orderCountByDate.get(dateKey) || 0) + 1)
        })

        // User registrations by day (last 30 days)
        const users = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true
            }
        })

        const usersByDate = new Map<string, number>()
        users.forEach(user => {
            const dateKey = user.createdAt.toISOString().split('T')[0]
            usersByDate.set(dateKey, (usersByDate.get(dateKey) || 0) + 1)
        })

        // Fill in missing dates with 0
        const fillDateRange = (map: Map<string, number>) => {
            const result: { date: string; value: number }[] = []
            for (let i = 29; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateKey = date.toISOString().split('T')[0]
                result.push({
                    date: dateKey,
                    value: map.get(dateKey) || 0
                })
            }
            return result
        }

        const analytics = {
            revenue: fillDateRange(revenueByDate),
            orders: fillDateRange(orderCountByDate),
            userRegistrations: fillDateRange(usersByDate)
        }

        return NextResponse.json(analytics)
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        )
    }
}
