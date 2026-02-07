import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Scissors, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import {
    BESPOKE_STATUS_LABELS,
    BESPOKE_STATUS_COLORS,
    type BespokeOrderStatus,
} from "@/types/erp"

export default async function StaffBespokePage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user) {
        redirect("/staff/login")
    }

    const params = await searchParams
    const statusFilter = params.status || "ALL"
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    // Staff see bespoke orders where they have assigned tasks
    const where: Record<string, unknown> = {
        tasks: { some: { assignedToId: session.user.id } },
    }

    if (statusFilter !== "ALL") {
        where.status = statusFilter
    }

    const [orders, total] = await Promise.all([
        prisma.bespokeOrder.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true } },
                _count: { select: { tasks: true } },
                tasks: {
                    where: { assignedToId: session.user.id },
                    select: {
                        id: true,
                        status: true,
                        dueDate: true,
                    },
                },
            },
        }),
        prisma.bespokeOrder.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const statusTabs = [
        { value: "ALL", label: "All" },
        { value: "IN_PRODUCTION", label: "In Production" },
        { value: "FITTING", label: "Fitting" },
        { value: "ALTERATIONS", label: "Alterations" },
        { value: "QUALITY_CHECK", label: "Quality Check" },
        { value: "READY", label: "Ready" },
    ]

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    Bespoke Orders
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    {total} bespoke order{total !== 1 ? "s" : ""} with tasks assigned to you
                </p>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                    <Link
                        key={tab.value}
                        href={`/staff/bespoke?${buildParams({ status: tab.value === "ALL" ? "" : tab.value })}`}
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
                    icon={<Scissors className="w-8 h-8" />}
                    title="No bespoke orders"
                    description="You have no bespoke orders with tasks assigned to you."
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
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">My Tasks</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Next Due</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {orders.map((order) => {
                                    const status = order.status as BespokeOrderStatus
                                    const colors = BESPOKE_STATUS_COLORS[status]
                                    const myTasksCount = order.tasks.length
                                    const myPendingTasks = order.tasks.filter(
                                        (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
                                    )
                                    // Find the nearest due date among the user's pending tasks
                                    const nextDue = myPendingTasks
                                        .filter((t) => t.dueDate)
                                        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate

                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-obsidian-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/staff/bespoke/${order.id}`}
                                                    className="font-medium text-obsidian-900 hover:text-emerald-600 transition-colors font-tabular"
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
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-sm font-tabular text-obsidian-700">
                                                    {myPendingTasks.length}/{myTasksCount}
                                                </span>
                                                <span className="text-xs text-obsidian-400 ml-1">pending</span>
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 hidden lg:table-cell whitespace-nowrap">
                                                {nextDue ? (
                                                    <span className={new Date(nextDue) < new Date() ? "text-red-600 font-medium" : ""}>
                                                        {formatDate(nextDue)}
                                                        {new Date(nextDue) < new Date() && " (overdue)"}
                                                    </span>
                                                ) : (
                                                    <span className="text-obsidian-300">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/staff/bespoke/${order.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    View
                                                </Link>
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
                                        href={`/staff/bespoke?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
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
                                        href={`/staff/bespoke?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
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
