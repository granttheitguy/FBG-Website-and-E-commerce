import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Eye, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"

const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
    SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    REFUNDED: "bg-obsidian-50 text-obsidian-700 border-obsidian-200",
}

export default async function StaffOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
    const params = await searchParams
    const statusFilter = params.status || "ALL"
    const search = params.search || ""
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (statusFilter !== "ALL") {
        where.status = statusFilter
    }

    if (search) {
        where.OR = [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
        ]
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                _count: { select: { items: true } },
            },
        }),
        prisma.order.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const statusTabs = [
        { value: "ALL", label: "All" },
        { value: "PENDING", label: "Pending" },
        { value: "PROCESSING", label: "Processing" },
        { value: "SHIPPED", label: "Shipped" },
        { value: "DELIVERED", label: "Delivered" },
        { value: "CANCELLED", label: "Cancelled" },
    ]

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    Orders
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    {total} order{total !== 1 ? "s" : ""} found
                </p>
            </div>

            {/* Search */}
            <div className="mb-4">
                <form method="GET" className="flex gap-2">
                    <input
                        name="search"
                        type="text"
                        defaultValue={search}
                        placeholder="Search by order #, customer name, or email..."
                        className="flex-1 h-10 rounded-sm border border-obsidian-200 bg-white px-4 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                    />
                    {statusFilter !== "ALL" && (
                        <input type="hidden" name="status" value={statusFilter} />
                    )}
                    <button
                        type="submit"
                        className="px-4 h-10 rounded-sm bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                        aria-label="Search orders"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                    <Link
                        key={tab.value}
                        href={`/staff/orders?${buildParams({ status: tab.value === "ALL" ? "" : tab.value, search })}`}
                        className={`inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                            statusFilter === tab.value
                                ? "bg-emerald-600 text-white"
                                : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                        }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Table */}
            {orders.length === 0 ? (
                <EmptyState
                    icon={<ShoppingBag className="w-8 h-8" />}
                    title="No orders found"
                    description={search ? "Try adjusting your search or filter criteria." : "No orders have been placed yet."}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Order #</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Total</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Date</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-obsidian-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-obsidian-900 font-tabular">
                                            #{order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="min-w-0">
                                                <p className="text-obsidian-900 font-medium truncate">
                                                    {order.user?.name || order.customerEmail || "Guest"}
                                                </p>
                                                {order.user && (
                                                    <p className="text-xs text-obsidian-500 truncate">
                                                        {order.user.email}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium font-tabular text-obsidian-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                                ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.PENDING
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden md:table-cell whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/staff/orders/${order.id}`}
                                                className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-sm hover:bg-obsidian-100 text-obsidian-500 hover:text-obsidian-900 transition-colors"
                                                aria-label={`View order ${order.orderNumber}`}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-obsidian-200 px-6 py-3">
                            <p className="text-sm text-obsidian-500">
                                Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/staff/orders?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
                                            search,
                                            page: String(page - 1),
                                        })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Link>
                                )}
                                <span className="text-sm text-obsidian-700 font-medium px-2">
                                    {page} / {totalPages}
                                </span>
                                {page < totalPages && (
                                    <Link
                                        href={`/staff/orders?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
                                            search,
                                            page: String(page + 1),
                                        })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function buildParams(params: Record<string, string>): string {
    const sp = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
        if (val) sp.set(key, val)
    }
    return sp.toString()
}
