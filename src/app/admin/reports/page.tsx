import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, Users, ShoppingBag, DollarSign, Package, AlertCircle } from "lucide-react"
import { DateRangeFilter } from "./ReportsClient"
import { ExportButton } from "./ExportButton"
import { Suspense } from "react"

interface SearchParams {
    startDate?: string
    endDate?: string
}

async function getReportData(startDate?: Date, endDate?: Date) {
    const { prisma } = await import("@/lib/db")

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
        dateFilter.gte = startDate
    }
    if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // End of day
        dateFilter.lte = end
    }

    const orderWhereClause = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}

    // 1. Total Revenue & Orders (filtered by date)
    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: "PAID",
            ...orderWhereClause,
        },
        select: { total: true, createdAt: true },
    })

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // 2. Recent Sales Chart Data (grouped by day)
    const salesByDay = orders.reduce((acc: any, order) => {
        const date = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        acc[date] = (acc[date] || 0) + order.total
        return acc
    }, {})

    const chartData = Object.entries(salesByDay)
        .map(([date, amount]) => ({
            date,
            amount: amount as number,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 3. Top Products (in date range)
    const topProductsRaw = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
            order: {
                paymentStatus: "PAID",
                ...orderWhereClause,
            },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
    })

    const topProducts = await Promise.all(
        topProductsRaw.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true, basePrice: true },
            })
            return {
                name: product?.name || "Unknown Product",
                price: product?.basePrice || 0,
                sold: item._sum.quantity || 0,
                revenue: item._sum.totalPrice || 0,
            }
        })
    )

    // 4. Customer Count (in date range)
    const customerFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    const totalCustomers = await prisma.user.count({
        where: { role: "CUSTOMER", ...customerFilter },
    })

    // 5. Orders by Status (in date range)
    const ordersByStatus = await prisma.order.groupBy({
        by: ["status"],
        where: orderWhereClause,
        _count: true,
    })

    // 6. Revenue by Payment Status (in date range)
    const revenueByPayment = await prisma.order.groupBy({
        by: ["paymentStatus"],
        where: orderWhereClause,
        _sum: { total: true },
        _count: true,
    })

    // 7. Products with No Sales (in date range)
    const productsWithSales = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
            order: orderWhereClause,
        },
    })

    const soldProductIds = productsWithSales.map((p) => p.productId)

    const productsWithNoSales = await prisma.product.findMany({
        where: {
            id: { notIn: soldProductIds },
            status: "ACTIVE",
        },
        select: {
            name: true,
            basePrice: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
    })

    // 8. New Customers by Month (in date range)
    const customersInRange = await prisma.user.findMany({
        where: {
            role: "CUSTOMER",
            ...customerFilter,
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    })

    const customersByMonth = customersInRange.reduce((acc: any, customer) => {
        const month = new Date(customer.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        acc[month] = (acc[month] || 0) + 1
        return acc
    }, {})

    const customerGrowth = Object.entries(customersByMonth).map(([month, count]) => ({
        month,
        count: count as number,
    }))

    return {
        summary: { totalRevenue, totalOrders, averageOrderValue, totalCustomers },
        chartData,
        topProducts,
        ordersByStatus,
        revenueByPayment,
        productsWithNoSales,
        customerGrowth,
    }
}

async function ReportsContent({ searchParams }: { searchParams: SearchParams }) {
    // Parse date range from search params
    const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined
    const endDate = searchParams.endDate ? new Date(searchParams.endDate) : undefined

    const data = await getReportData(startDate, endDate)

    return (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-obsidian-500">Total Revenue</h3>
                        <div className="p-2 bg-green-50 rounded-full">
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-obsidian-900">
                        {formatCurrency(data.summary.totalRevenue)}
                    </p>
                    <p className="text-xs text-obsidian-500 mt-1">From paid orders</p>
                </div>

                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-obsidian-500">Total Orders</h3>
                        <div className="p-2 bg-blue-50 rounded-full">
                            <ShoppingBag className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-obsidian-900">{data.summary.totalOrders}</p>
                    <p className="text-xs text-obsidian-500 mt-1">Paid orders</p>
                </div>

                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-obsidian-500">Avg. Order Value</h3>
                        <div className="p-2 bg-purple-50 rounded-full">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-obsidian-900">
                        {formatCurrency(data.summary.averageOrderValue)}
                    </p>
                    <p className="text-xs text-obsidian-500 mt-1">Based on paid orders</p>
                </div>

                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-obsidian-500">New Customers</h3>
                        <div className="p-2 bg-orange-50 rounded-full">
                            <Users className="w-4 h-4 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-obsidian-900">{data.summary.totalCustomers}</p>
                    <p className="text-xs text-obsidian-500 mt-1">In selected period</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <h3 className="text-lg font-medium text-obsidian-900 mb-6">Sales Over Time</h3>
                    <div className="h-64 flex items-end gap-2">
                        {data.chartData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-obsidian-400">
                                No sales data available
                            </div>
                        ) : (
                            data.chartData.map((day, i) => {
                                const max = Math.max(...data.chartData.map((d) => d.amount))
                                const height = (day.amount / max) * 100
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-obsidian-900 rounded-t-sm hover:bg-obsidian-700 transition-colors relative"
                                            style={{ height: `${height}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-obsidian-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {formatCurrency(day.amount)}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-obsidian-500 rotate-45 origin-left translate-y-2">
                                            {day.date}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <h3 className="text-lg font-medium text-obsidian-900 mb-6">Top Products</h3>
                    <div className="space-y-6">
                        {data.topProducts.length === 0 ? (
                            <p className="text-obsidian-500 text-sm">No products sold yet.</p>
                        ) : (
                            data.topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-obsidian-900 truncate max-w-[150px]">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-obsidian-500">{formatCurrency(product.revenue)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-obsidian-900">{product.sold} sold</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Orders & Revenue Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Orders by Status */}
                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <ShoppingBag className="w-5 h-5 text-obsidian-700" />
                        <h3 className="text-lg font-medium text-obsidian-900">Orders by Status</h3>
                    </div>
                    <div className="space-y-4">
                        {data.ordersByStatus.length === 0 ? (
                            <p className="text-obsidian-500 text-sm">No orders in this period.</p>
                        ) : (
                            data.ordersByStatus.map((status) => {
                                const total = data.ordersByStatus.reduce((sum, s) => sum + s._count, 0)
                                const percentage = total > 0 ? (status._count / total) * 100 : 0

                                const statusColors: Record<string, string> = {
                                    PENDING: "bg-yellow-500",
                                    PROCESSING: "bg-blue-500",
                                    SHIPPED: "bg-purple-500",
                                    DELIVERED: "bg-green-500",
                                    CANCELLED: "bg-red-500",
                                }

                                return (
                                    <div key={status.status}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-obsidian-700">
                                                {status.status}
                                            </span>
                                            <span className="text-sm text-obsidian-500">
                                                {status._count} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-3 bg-obsidian-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${statusColors[status.status] || "bg-obsidian-500"}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Revenue by Payment Status */}
                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="w-5 h-5 text-obsidian-700" />
                        <h3 className="text-lg font-medium text-obsidian-900">Revenue by Payment Status</h3>
                    </div>
                    <div className="space-y-4">
                        {data.revenueByPayment.length === 0 ? (
                            <p className="text-obsidian-500 text-sm">No revenue data available.</p>
                        ) : (
                            data.revenueByPayment.map((payment) => {
                                const totalRevenue = data.revenueByPayment.reduce(
                                    (sum, p) => sum + (p._sum.total || 0),
                                    0
                                )
                                const revenue = payment._sum.total || 0
                                const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0

                                const paymentColors: Record<string, string> = {
                                    PAID: "bg-green-500",
                                    UNPAID: "bg-yellow-500",
                                    FAILED: "bg-red-500",
                                    REFUNDED: "bg-gray-500",
                                }

                                return (
                                    <div key={payment.paymentStatus}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-obsidian-700">
                                                {payment.paymentStatus}
                                            </span>
                                            <span className="text-sm text-obsidian-500">
                                                {formatCurrency(revenue)} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-3 bg-obsidian-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${paymentColors[payment.paymentStatus] || "bg-obsidian-500"}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-obsidian-500 mt-1">{payment._count} orders</p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Growth & Products with No Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Customer Growth */}
                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-obsidian-700" />
                        <h3 className="text-lg font-medium text-obsidian-900">New Customers by Month</h3>
                    </div>
                    <div className="space-y-3">
                        {data.customerGrowth.length === 0 ? (
                            <p className="text-obsidian-500 text-sm">No new customers in this period.</p>
                        ) : (
                            data.customerGrowth.map((month) => (
                                <div key={month.month} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-obsidian-700">{month.month}</span>
                                    <span className="text-sm text-obsidian-900 font-semibold">{month.count} new</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Products with No Sales */}
                <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-medium text-obsidian-900">Products with No Sales</h3>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {data.productsWithNoSales.length === 0 ? (
                            <p className="text-obsidian-500 text-sm">All active products have sales!</p>
                        ) : (
                            data.productsWithNoSales.map((product, i) => (
                                <div key={i} className="flex items-center justify-between pb-2 border-b border-obsidian-100">
                                    <div>
                                        <p className="text-sm font-medium text-obsidian-900">{product.name}</p>
                                        <p className="text-xs text-obsidian-500">
                                            Added {new Date(product.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-sm text-obsidian-600">{formatCurrency(product.basePrice)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ startDate?: string; endDate?: string }>
}) {
    const session = await auth()

    if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Reports & Analytics</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Overview of your store's performance.</p>
                </div>
                <Suspense fallback={<div className="h-10" />}>
                    <ExportButton />
                </Suspense>
            </div>

            <Suspense fallback={<div className="bg-white p-6 rounded-sm border border-obsidian-200 animate-pulse h-32" />}>
                <DateRangeFilter />
            </Suspense>

            <Suspense
                fallback={
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-sm border border-obsidian-200 animate-pulse h-32" />
                            ))}
                        </div>
                    </div>
                }
            >
                <ReportsContent searchParams={params} />
            </Suspense>
        </div>
    )
}
