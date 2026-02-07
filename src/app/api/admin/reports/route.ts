import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        const session = await auth()

        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 1. Total Revenue & Orders
        const orders = await prisma.order.findMany({
            where: { paymentStatus: "PAID" },
            select: { total: true, createdAt: true }
        })

        const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0)
        const totalOrders = orders.length
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // 2. Recent Sales (Last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo)

        // Group by day for chart
        const salesByDay = recentOrders.reduce((acc: any, order) => {
            const date = new Date(order.createdAt).toLocaleDateString()
            acc[date] = (acc[date] || 0) + order.total
            return acc
        }, {})

        const chartData = Object.entries(salesByDay).map(([date, amount]) => ({
            date,
            amount
        })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // 3. Top Products
        // This is heavier, usually we'd have an aggregate table or use groupBy on OrderItems
        // For now, let's just count from OrderItems of paid orders
        const topProductsRaw = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 5
        })

        // Fetch product details for these IDs
        const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true, basePrice: true }
            })
            return {
                name: product?.name || "Unknown Product",
                price: product?.basePrice || 0,
                sold: item._sum.quantity || 0
            }
        }))

        // 4. Customer Growth (Total Users)
        const totalCustomers = await prisma.user.count({
            where: { role: "CUSTOMER" }
        })

        const newCustomersThisMonth = await prisma.user.count({
            where: {
                role: "CUSTOMER",
                createdAt: { gte: thirtyDaysAgo }
            }
        })

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                totalCustomers,
                newCustomersThisMonth
            },
            chartData,
            topProducts
        })

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
