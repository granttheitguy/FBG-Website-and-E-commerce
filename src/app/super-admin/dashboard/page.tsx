import { RevenueChart } from "@/components/features/admin/revenue-chart"
import { UserGrowthChart } from "@/components/features/admin/user-growth-chart"
import { prisma } from "@/lib/db"
import {
    TrendingUp,
    Users,
    ShoppingCart,
    Ticket,
    Plus,
    FileText,
    Settings,
    Activity as ActivityIcon,
    ArrowUpRight,
    DollarSign
} from "lucide-react"
import Link from "next/link"

async function getStats() {
    const [
        revenueData,
        userCounts,
        orderCounts,
        ticketCounts
    ] = await Promise.all([
        prisma.order.aggregate({
            where: { paymentStatus: "PAID" },
            _sum: { total: true }
        }),
        prisma.user.groupBy({
            by: ["role"],
            _count: { _all: true }
        }),
        prisma.order.groupBy({
            by: ["status"],
            _count: { _all: true }
        }),
        prisma.supportTicket.groupBy({
            by: ["status"],
            _count: { _all: true }
        })
    ])

    return {
        totalRevenue: revenueData._sum.total || 0,
        users: userCounts.reduce((acc, r) => ({ ...acc, [r.role]: r._count._all }), {} as Record<string, number>),
        totalUsers: userCounts.reduce((sum, r) => sum + r._count._all, 0),
        orders: orderCounts.reduce((acc, o) => ({ ...acc, [o.status]: o._count._all }), {} as Record<string, number>),
        totalOrders: orderCounts.reduce((sum, o) => sum + o._count._all, 0),
        tickets: ticketCounts.reduce((acc, t) => ({ ...acc, [t.status]: t._count._all }), {} as Record<string, number>),
        totalTickets: ticketCounts.reduce((sum, t) => sum + t._count._all, 0)
    }
}

async function getAnalytics() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [orders, users] = await Promise.all([
        prisma.order.findMany({
            where: {
                paymentStatus: "PAID",
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { total: true, createdAt: true }
        }),
        prisma.user.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        })
    ])

    // Group by date
    const revenueByDate = new Map<string, number>()
    const usersByDate = new Map<string, number>()

    orders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0]
        revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + order.total)
    })

    users.forEach(user => {
        const dateKey = user.createdAt.toISOString().split('T')[0]
        usersByDate.set(dateKey, (usersByDate.get(dateKey) || 0) + 1)
    })

    // Fill in all 30 days
    const fillDateRange = (map: Map<string, number>) => {
        const result: { date: string; value: number }[] = []
        for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateKey = date.toISOString().split('T')[0]
            result.push({ date: dateKey, value: map.get(dateKey) || 0 })
        }
        return result
    }

    return {
        revenue: fillDateRange(revenueByDate),
        userGrowth: fillDateRange(usersByDate)
    }
}

async function getRecentActivity() {
    const logs = await prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: true }
    })
    return logs
}

export default async function SuperAdminDashboard() {
    const [stats, analytics, recentActivity] = await Promise.all([
        getStats(),
        getAnalytics(),
        getRecentActivity()
    ])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(value)
    }

    return (
        <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-obsidian-900">Dashboard</h1>
                    <p className="text-obsidian-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">Total Revenue</p>
                            <div className="w-10 h-10 rounded-sm bg-blue-50 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-obsidian-900">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="text-xs text-obsidian-500 mt-2">From {stats.totalOrders} paid orders</p>
                    </div>

                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">Total Users</p>
                            <div className="w-10 h-10 rounded-sm bg-green-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-obsidian-900">{stats.totalUsers}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                            <span className="text-obsidian-500">Admins: {stats.users.ADMIN || 0}</span>
                            <span className="text-obsidian-300">|</span>
                            <span className="text-obsidian-500">Staff: {stats.users.STAFF || 0}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">Total Orders</p>
                            <div className="w-10 h-10 rounded-sm bg-purple-50 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-obsidian-900">{stats.totalOrders}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                            <span className="text-green-600">Delivered: {stats.orders.DELIVERED || 0}</span>
                            <span className="text-obsidian-300">|</span>
                            <span className="text-blue-600">Pending: {stats.orders.PENDING || 0}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide">Support Tickets</p>
                            <div className="w-10 h-10 rounded-sm bg-amber-50 flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-obsidian-900">{stats.totalTickets}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                            <span className="text-red-600">Open: {stats.tickets.OPEN || 0}</span>
                            <span className="text-obsidian-300">|</span>
                            <span className="text-green-600">Resolved: {stats.tickets.RESOLVED || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Chart */}
                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-obsidian-900">Revenue Trend</h3>
                                <p className="text-sm text-obsidian-500">Last 30 days</p>
                            </div>
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <RevenueChart data={analytics.revenue} />
                    </div>

                    {/* User Growth Chart */}
                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-obsidian-900">User Growth</h3>
                                <p className="text-sm text-obsidian-500">New registrations</p>
                            </div>
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <UserGrowthChart data={analytics.userGrowth} />
                    </div>
                </div>

                {/* Bottom Row: Recent Activity + Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-obsidian-200 shadow-sm">
                        <div className="p-6 border-b border-obsidian-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-obsidian-900">Recent Activity</h3>
                                <p className="text-sm text-obsidian-500">Latest system actions</p>
                            </div>
                            <Link
                                href="/super-admin/activity"
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                View All <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-obsidian-100">
                            {recentActivity.length === 0 ? (
                                <div className="p-8 text-center text-obsidian-500">
                                    <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-obsidian-300" />
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                recentActivity.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-obsidian-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-obsidian-100 flex items-center justify-center flex-shrink-0">
                                                <ActivityIcon className="w-4 h-4 text-obsidian-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-obsidian-900">{log.action}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-obsidian-500">{log.user.name}</p>
                                                    {log.entityType && (
                                                        <>
                                                            <span className="text-obsidian-300">•</span>
                                                            <span className="text-xs px-2 py-0.5 bg-obsidian-100 text-obsidian-600 rounded">
                                                                {log.entityType}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-obsidian-400 flex-shrink-0">
                                                {new Date(log.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-obsidian-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-obsidian-900 mb-1">Quick Actions</h3>
                        <p className="text-sm text-obsidian-500 mb-6">Common tasks</p>
                        <div className="space-y-3">
                            <Link
                                href="/super-admin/users"
                                className="flex items-center gap-3 p-3 rounded-sm border border-obsidian-200 hover:border-obsidian-300 hover:bg-obsidian-50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-sm bg-blue-50 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-obsidian-900">Create Admin</p>
                                    <p className="text-xs text-obsidian-500">Add new admin user</p>
                                </div>
                            </Link>

                            <Link
                                href="/super-admin/activity"
                                className="flex items-center gap-3 p-3 rounded-sm border border-obsidian-200 hover:border-obsidian-300 hover:bg-obsidian-50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-sm bg-green-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-obsidian-900">View Logs</p>
                                    <p className="text-xs text-obsidian-500">System activity</p>
                                </div>
                            </Link>

                            <Link
                                href="/super-admin/settings"
                                className="flex items-center gap-3 p-3 rounded-sm border border-obsidian-200 hover:border-obsidian-300 hover:bg-obsidian-50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-sm bg-purple-50 flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-obsidian-900">Settings</p>
                                    <p className="text-xs text-obsidian-500">System config</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
    )
}
