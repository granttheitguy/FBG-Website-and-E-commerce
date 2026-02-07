import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { DollarSign, ShoppingBag, Users, TrendingUp, Package, Scissors, Award, Repeat } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

async function getReportData() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [
        totalRevenue,
        last30DaysRevenue,
        ordersByStatus,
        topProducts,
        customerStats,
        bespokeStats,
        categoryRevenue,
        clvData,
        repeatPurchaseData,
        monthlyRevenueData,
        segmentStats,
    ] = await Promise.all([
        // Total revenue (all time)
        prisma.order.aggregate({
            where: { paymentStatus: "PAID" },
            _sum: { total: true },
            _count: true,
        }),

        // Last 30 days revenue
        prisma.order.aggregate({
            where: {
                paymentStatus: "PAID",
                createdAt: { gte: thirtyDaysAgo },
            },
            _sum: { total: true },
            _count: true,
        }),

        // Orders by status
        prisma.order.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),

        // Top 5 products by revenue
        prisma.orderItem.groupBy({
            by: ["productId"],
            _sum: {
                totalPrice: true,
                quantity: true,
            },
            orderBy: {
                _sum: {
                    totalPrice: "desc",
                },
            },
            take: 5,
        }),

        // Customer stats
        prisma.user.aggregate({
            where: { role: "CUSTOMER" },
            _count: true,
        }),

        // Bespoke order stats
        prisma.bespokeOrder.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),

        // Revenue by Category
        prisma.$queryRaw<Array<{ categoryName: string; revenue: number; orderCount: number }>>`
            SELECT
                c.name as categoryName,
                SUM(oi.totalPrice) as revenue,
                COUNT(DISTINCT o.id) as orderCount
            FROM OrderItem oi
            INNER JOIN "Order" o ON oi.orderId = o.id
            INNER JOIN Product p ON oi.productId = p.id
            INNER JOIN _CategoryToProduct cp ON p.id = cp.B
            INNER JOIN Category c ON cp.A = c.id
            WHERE o.paymentStatus = 'PAID'
            GROUP BY c.name
            ORDER BY revenue DESC
            LIMIT 5
        `,

        // Customer Lifetime Value (average total spent per customer with at least 1 paid order)
        prisma.order.groupBy({
            by: ["userId"],
            where: { paymentStatus: "PAID", userId: { not: null } },
            _sum: { total: true },
        }),

        // Repeat Purchase Rate (customers with 2+ paid orders)
        prisma.order.groupBy({
            by: ["userId"],
            where: { paymentStatus: "PAID", userId: { not: null } },
            _count: { _all: true },
        }),

        // Monthly Revenue Trend (last 6 months)
        prisma.order.findMany({
            where: {
                paymentStatus: "PAID",
                createdAt: { gte: sixMonthsAgo },
            },
            select: {
                createdAt: true,
                total: true,
            },
        }),

        // Top Customer Segments
        prisma.customerSegment.findMany({
            include: {
                members: {
                    include: {
                        user: {
                            include: {
                                orders: {
                                    where: { paymentStatus: "PAID" },
                                    select: { total: true },
                                },
                            },
                        },
                    },
                },
            },
        }),
    ])

    // Get product details for top products
    const productIds = topProducts.map((p) => p.productId)
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, images: true },
    })

    const topProductsWithDetails = topProducts.map((tp) => {
        const product = products.find((p) => p.id === tp.productId)
        return {
            productId: tp.productId,
            name: product?.name ?? "Unknown Product",
            image: product?.images?.[0] ?? null,
            totalRevenue: tp._sum.totalPrice ?? 0,
            totalQuantity: tp._sum.quantity ?? 0,
        }
    })

    // Calculate CLV
    const totalCustomerSpend = clvData.reduce((sum, c) => sum + (c._sum.total || 0), 0)
    const customersWithOrders = clvData.length
    const avgClv = customersWithOrders > 0 ? totalCustomerSpend / customersWithOrders : 0

    // Calculate Repeat Purchase Rate
    const customersWithMultipleOrders = repeatPurchaseData.filter((c) => c._count._all >= 2).length
    const totalCustomersWithOrders = repeatPurchaseData.length
    const repeatPurchaseRate =
        totalCustomersWithOrders > 0 ? (customersWithMultipleOrders / totalCustomersWithOrders) * 100 : 0

    // Monthly Revenue Trend
    const monthlyRevenue = monthlyRevenueData.reduce((acc: any, order) => {
        const month = new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        })
        if (!acc[month]) {
            acc[month] = { revenue: 0, count: 0 }
        }
        acc[month].revenue += order.total
        acc[month].count += 1
        return acc
    }, {})

    const monthlyTrend = Object.entries(monthlyRevenue)
        .map(([month, data]: [string, any]) => ({
            month,
            revenue: data.revenue,
            orderCount: data.count,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Top Segments
    const topSegments = segmentStats
        .map((segment) => {
            const totalSpend = segment.members.reduce((sum, member) => {
                const customerSpend = member.user.orders.reduce((orderSum, order) => orderSum + order.total, 0)
                return sum + customerSpend
            }, 0)
            return {
                name: segment.name,
                memberCount: segment.members.length,
                totalSpend,
                avgSpendPerMember: segment.members.length > 0 ? totalSpend / segment.members.length : 0,
                color: segment.color,
            }
        })
        .sort((a, b) => b.totalSpend - a.totalSpend)
        .slice(0, 5)

    return {
        totalRevenue: totalRevenue._sum.total ?? 0,
        totalOrders: totalRevenue._count,
        last30DaysRevenue: last30DaysRevenue._sum.total ?? 0,
        last30DaysOrders: last30DaysRevenue._count,
        ordersByStatus,
        topProducts: topProductsWithDetails,
        totalCustomers: customerStats._count,
        bespokeStats,
        categoryRevenue,
        avgClv,
        repeatPurchaseRate,
        customersWithMultipleOrders,
        totalCustomersWithOrders,
        monthlyTrend,
        topSegments,
    }
}

export default async function SuperAdminReportsPage() {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        redirect("/")
    }

    const data = await getReportData()

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-obsidian-900 font-serif">Business Intelligence</h1>
                <p className="text-obsidian-500 mt-1">Comprehensive analytics and insights</p>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">Total Revenue</p>
                        <div className="w-10 h-10 rounded-sm bg-green-50 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-obsidian-900">{formatCurrency(data.totalRevenue)}</p>
                    <p className="text-xs text-obsidian-500 mt-2">
                        All time • {data.totalOrders} orders
                    </p>
                </div>

                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">Last 30 Days</p>
                        <div className="w-10 h-10 rounded-sm bg-blue-50 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-obsidian-900">{formatCurrency(data.last30DaysRevenue)}</p>
                    <p className="text-xs text-obsidian-500 mt-2">{data.last30DaysOrders} orders</p>
                </div>

                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">
                            Avg. Customer Value
                        </p>
                        <div className="w-10 h-10 rounded-sm bg-purple-50 flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-obsidian-900">{formatCurrency(data.avgClv)}</p>
                    <p className="text-xs text-obsidian-500 mt-2">Customer lifetime value</p>
                </div>

                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">
                            Repeat Purchase Rate
                        </p>
                        <div className="w-10 h-10 rounded-sm bg-amber-50 flex items-center justify-center">
                            <Repeat className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-obsidian-900">{data.repeatPurchaseRate.toFixed(1)}%</p>
                    <p className="text-xs text-obsidian-500 mt-2">
                        {data.customersWithMultipleOrders} of {data.totalCustomersWithOrders} customers
                    </p>
                </div>
            </div>

            {/* Revenue Breakdown by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="p-6 border-b border-obsidian-200">
                        <h2 className="text-lg font-semibold text-obsidian-900 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Revenue by Category
                        </h2>
                        <p className="text-sm text-obsidian-500 mt-1">Top 5 performing categories</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {data.categoryRevenue.length === 0 ? (
                                <p className="text-obsidian-500 text-sm">No category data available</p>
                            ) : (
                                data.categoryRevenue.map((category) => {
                                    const maxRevenue = Math.max(...data.categoryRevenue.map((c) => Number(c.revenue)))
                                    const percentage = maxRevenue > 0 ? (Number(category.revenue) / maxRevenue) * 100 : 0

                                    return (
                                        <div key={category.categoryName}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-obsidian-700">
                                                    {category.categoryName}
                                                </span>
                                                <span className="text-sm text-obsidian-900 font-semibold">
                                                    {formatCurrency(Number(category.revenue))}
                                                </span>
                                            </div>
                                            <div className="h-3 bg-obsidian-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gold-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-obsidian-500 mt-1">
                                                {Number(category.orderCount)} orders
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Revenue Trend */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="p-6 border-b border-obsidian-200">
                        <h2 className="text-lg font-semibold text-obsidian-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Monthly Revenue Trend
                        </h2>
                        <p className="text-sm text-obsidian-500 mt-1">Last 6 months</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {data.monthlyTrend.length === 0 ? (
                                <p className="text-obsidian-500 text-sm">No data available</p>
                            ) : (
                                data.monthlyTrend.map((month) => (
                                    <div key={month.month} className="flex items-center justify-between pb-3 border-b border-obsidian-100 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-obsidian-900">{month.month}</p>
                                            <p className="text-xs text-obsidian-500">{month.orderCount} orders</p>
                                        </div>
                                        <p className="text-sm font-semibold text-obsidian-900">
                                            {formatCurrency(month.revenue)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order & Bespoke Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="p-6 border-b border-obsidian-200">
                        <h2 className="text-lg font-semibold text-obsidian-900 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            Order Status Breakdown
                        </h2>
                        <p className="text-sm text-obsidian-500 mt-1">Distribution of order statuses</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {data.ordersByStatus.map((status) => {
                                const total = data.totalOrders
                                const percentage = total > 0 ? (status._count._all / total) * 100 : 0
                                const statusColors: Record<string, string> = {
                                    PENDING: "bg-yellow-500",
                                    PROCESSING: "bg-blue-500",
                                    SHIPPED: "bg-purple-500",
                                    DELIVERED: "bg-green-500",
                                    CANCELLED: "bg-red-500",
                                }

                                return (
                                    <div key={status.status}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-obsidian-700">
                                                {status.status}
                                            </span>
                                            <span className="text-sm text-obsidian-500">
                                                {status._count._all} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-obsidian-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${statusColors[status.status] ?? "bg-obsidian-500"}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Bespoke Status Breakdown */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="p-6 border-b border-obsidian-200">
                        <h2 className="text-lg font-semibold text-obsidian-900 flex items-center gap-2">
                            <Scissors className="w-5 h-5" />
                            Bespoke Order Status
                        </h2>
                        <p className="text-sm text-obsidian-500 mt-1">Custom order pipeline</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {data.bespokeStats.map((status) => {
                                const total = data.bespokeStats.reduce((sum, s) => sum + s._count._all, 0)
                                const percentage = total > 0 ? (status._count._all / total) * 100 : 0

                                return (
                                    <div key={status.status}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-obsidian-700">
                                                {status.status.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-sm text-obsidian-500">
                                                {status._count._all} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-obsidian-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500" style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products & Customer Segments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Products */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="p-6 border-b border-obsidian-200">
                        <h2 className="text-lg font-semibold text-obsidian-900 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Top 5 Products by Revenue
                        </h2>
                        <p className="text-sm text-obsidian-500 mt-1">Best performing products</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-obsidian-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                        Units Sold
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-200">
                                {data.topProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-obsidian-500">
                                            No product data available
                                        </td>
                                    </tr>
                                ) : (
                                    data.topProducts.map((product, index) => (
                                        <tr key={product.productId} className="hover:bg-obsidian-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-obsidian-100 rounded-sm flex items-center justify-center text-obsidian-600 font-medium">
                                                        #{index + 1}
                                                    </div>
                                                    <span className="font-medium text-obsidian-900">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-700">{product.totalQuantity} units</td>
                                            <td className="px-6 py-4 text-obsidian-900 font-semibold">
                                                {formatCurrency(product.totalRevenue)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Customer Segments */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="p-6 border-b border-obsidian-200">
                        <h2 className="text-lg font-semibold text-obsidian-900 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Top Customer Segments
                        </h2>
                        <p className="text-sm text-obsidian-500 mt-1">By total spend</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {data.topSegments.length === 0 ? (
                                <p className="text-obsidian-500 text-sm">No segment data available</p>
                            ) : (
                                data.topSegments.map((segment) => (
                                    <div key={segment.name} className="pb-4 border-b border-obsidian-100 last:border-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: segment.color }}
                                                />
                                                <span className="text-sm font-medium text-obsidian-900">
                                                    {segment.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-obsidian-900">
                                                {formatCurrency(segment.totalSpend)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-obsidian-500">
                                            <span>{segment.memberCount} members</span>
                                            <span>Avg: {formatCurrency(segment.avgSpendPerMember)}/member</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
