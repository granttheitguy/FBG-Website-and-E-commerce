import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Scissors, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import {
    BESPOKE_STATUS_LABELS,
    BESPOKE_STATUS_COLORS,
    BESPOKE_STATUS_ORDER,
    type BespokeOrderStatus,
} from "@/types/erp"

export default async function AdminBespokePage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

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
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search } },
        ]
    }

    const [orders, total, statusCounts] = await Promise.all([
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
        prisma.bespokeOrder.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
    ])

    const countsMap: Record<string, number> = {}
    let allCount = 0
    statusCounts.forEach((sc) => {
        countsMap[sc.status] = sc._count._all
        allCount += sc._count._all
    })

    const totalPages = Math.ceil(total / limit)

    // Status tabs - show common ones
    const statusTabs: { value: string; label: string; count: number }[] = [
        { value: "ALL", label: "All", count: allCount },
        ...BESPOKE_STATUS_ORDER
            .filter((s) => s !== "CANCELLED")
            .map((s) => ({
                value: s,
                label: BESPOKE_STATUS_LABELS[s],
                count: countsMap[s] || 0,
            })),
    ]

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Bespoke Orders
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {total} order{total !== 1 ? "s" : ""}{statusFilter !== "ALL" ? ` (${BESPOKE_STATUS_LABELS[statusFilter as BespokeOrderStatus]})` : ""}
                    </p>
                </div>
                <Link
                    href="/admin/bespoke/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Order
                </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
                <form method="GET" className="flex gap-2">
                    <input
                        name="search"
                        type="text"
                        defaultValue={search}
                        placeholder="Search by order #, customer name, email, or phone..."
                        className="flex-1 h-10 rounded-sm border border-obsidian-200 bg-white px-4 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                    />
                    {statusFilter !== "ALL" && (
                        <input type="hidden" name="status" value={statusFilter} />
                    )}
                    <button
                        type="submit"
                        className="px-4 h-10 rounded-sm bg-obsidian-900 text-white text-sm font-medium hover:bg-obsidian-800 transition-colors"
                        aria-label="Search bespoke orders"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-1 mb-6 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                    <Link
                        key={tab.value}
                        href={`/admin/bespoke?${buildParams({ status: tab.value === "ALL" ? "" : tab.value, search })}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                            statusFilter === tab.value
                                ? "bg-obsidian-900 text-white"
                                : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                        }`}
                    >
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                            statusFilter === tab.value
                                ? "bg-white/20"
                                : "bg-obsidian-200/60"
                        }`}>
                            {tab.count}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Table */}
            {orders.length === 0 ? (
                <EmptyState
                    icon={<Scissors className="w-8 h-8" />}
                    title="No bespoke orders yet"
                    description="Create your first bespoke order to start tracking custom garment production."
                    action={{ label: "New Bespoke Order", href: "/admin/bespoke/new" }}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Order #</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden md:table-cell">Est. Price</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden md:table-cell">Deposit</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Est. Completion</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden xl:table-cell">Tasks</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden xl:table-cell">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {orders.map((order) => {
                                    const status = order.status as BespokeOrderStatus
                                    const colors = BESPOKE_STATUS_COLORS[status]

                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-obsidian-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/admin/bespoke/${order.id}`}
                                                    className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors font-tabular"
                                                >
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-obsidian-900 truncate">
                                                        {order.customerName}
                                                    </p>
                                                    <p className="text-xs text-obsidian-500 truncate">
                                                        {order.customerPhone}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                                                >
                                                    {BESPOKE_STATUS_LABELS[status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-tabular text-obsidian-600 hidden md:table-cell">
                                                {order.estimatedPrice
                                                    ? formatCurrency(order.estimatedPrice)
                                                    : <span className="text-obsidian-300">--</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-tabular hidden md:table-cell">
                                                {order.depositAmount ? (
                                                    <span className={order.depositPaid ? "text-green-600" : "text-amber-600"}>
                                                        {formatCurrency(order.depositAmount)}
                                                        {order.depositPaid && (
                                                            <span className="text-[10px] ml-1 text-green-600">PAID</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-obsidian-300">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 hidden lg:table-cell whitespace-nowrap">
                                                {order.estimatedCompletionDate
                                                    ? formatDate(order.estimatedCompletionDate)
                                                    : <span className="text-obsidian-300">--</span>}
                                            </td>
                                            <td className="px-6 py-4 font-tabular text-obsidian-600 hidden xl:table-cell">
                                                {order._count.tasks}
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 hidden xl:table-cell whitespace-nowrap">
                                                {formatDate(order.createdAt)}
                                            </td>
                                        </tr>
                                    )
                                })}
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
                                        href={`/admin/bespoke?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
                                            search,
                                            page: String(page - 1),
                                        })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors"
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
                                        href={`/admin/bespoke?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
                                            search,
                                            page: String(page + 1),
                                        })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors"
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
