import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Factory, ChevronLeft, ChevronRight, User, Calendar } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import {
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    STAGE_LABELS,
    type ProductionTaskStatus,
    type ProductionStage,
} from "@/types/erp"

export default async function AdminProductionPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; stage?: string; assignee?: string; search?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams
    const statusFilter = params.status || "ALL"
    const stageFilter = params.stage || "ALL"
    const assigneeFilter = params.assignee || ""
    const search = params.search || ""
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (statusFilter !== "ALL") {
        where.status = statusFilter
    }
    if (stageFilter !== "ALL") {
        where.stage = stageFilter
    }
    if (assigneeFilter) {
        where.assignedToId = assigneeFilter
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { bespokeOrder: { orderNumber: { contains: search, mode: "insensitive" } } },
            { bespokeOrder: { customerName: { contains: search, mode: "insensitive" } } },
        ]
    }

    const [tasks, total, statusCounts, staffMembers] = await Promise.all([
        prisma.productionTask.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
            include: {
                assignedTo: { select: { id: true, name: true } },
                bespokeOrder: {
                    select: {
                        id: true,
                        orderNumber: true,
                        customerName: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.productionTask.count({ where }),
        prisma.productionTask.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
        prisma.user.findMany({
            where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ])

    const countsMap: Record<string, number> = {}
    let allCount = 0
    statusCounts.forEach((sc) => {
        countsMap[sc.status] = sc._count._all
        allCount += sc._count._all
    })

    const totalPages = Math.ceil(total / limit)

    const statusTabs = [
        { value: "ALL", label: "All", count: allCount },
        ...Object.entries(TASK_STATUS_LABELS).map(([key, label]) => ({
            value: key,
            label,
            count: countsMap[key] || 0,
        })),
    ]

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Production Pipeline
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {total} task{total !== 1 ? "s" : ""} across all bespoke orders
                    </p>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <form method="GET" className="flex gap-2 flex-1">
                    <input
                        name="search"
                        type="text"
                        defaultValue={search}
                        placeholder="Search tasks, order #, customer..."
                        className="flex-1 h-10 rounded-sm border border-obsidian-200 bg-white px-4 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                    />
                    {statusFilter !== "ALL" && <input type="hidden" name="status" value={statusFilter} />}
                    {stageFilter !== "ALL" && <input type="hidden" name="stage" value={stageFilter} />}
                    {assigneeFilter && <input type="hidden" name="assignee" value={assigneeFilter} />}
                    <button
                        type="submit"
                        className="px-4 h-10 rounded-sm bg-obsidian-900 text-white text-sm font-medium hover:bg-obsidian-800 transition-colors"
                        aria-label="Search tasks"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Stage + Assignee filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-obsidian-500">Stage:</span>
                    <div className="flex flex-wrap gap-1">
                        <Link
                            href={`/admin/production?${buildParams({ status: statusFilter === "ALL" ? "" : statusFilter, stage: "", assignee: assigneeFilter, search })}`}
                            className={`px-2 py-1 rounded-sm text-[11px] font-medium transition-colors ${
                                stageFilter === "ALL"
                                    ? "bg-obsidian-900 text-white"
                                    : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                            }`}
                        >
                            All
                        </Link>
                        {(Object.entries(STAGE_LABELS) as [ProductionStage, string][]).map(([key, label]) => (
                            <Link
                                key={key}
                                href={`/admin/production?${buildParams({ status: statusFilter === "ALL" ? "" : statusFilter, stage: key, assignee: assigneeFilter, search })}`}
                                className={`px-2 py-1 rounded-sm text-[11px] font-medium transition-colors ${
                                    stageFilter === key
                                        ? "bg-obsidian-900 text-white"
                                        : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                                }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-1 mb-6">
                {statusTabs.map((tab) => (
                    <Link
                        key={tab.value}
                        href={`/admin/production?${buildParams({ status: tab.value === "ALL" ? "" : tab.value, stage: stageFilter === "ALL" ? "" : stageFilter, assignee: assigneeFilter, search })}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                            statusFilter === tab.value
                                ? "bg-obsidian-900 text-white"
                                : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                        }`}
                    >
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                            statusFilter === tab.value ? "bg-white/20" : "bg-obsidian-200/60"
                        }`}>
                            {tab.count}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Table */}
            {tasks.length === 0 ? (
                <EmptyState
                    icon={<Factory className="w-8 h-8" />}
                    title="No production tasks"
                    description="Production tasks will appear here when created from bespoke orders."
                    action={{ label: "View Bespoke Orders", href: "/admin/bespoke" }}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Task</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden sm:table-cell">Order</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Stage</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Assigned To</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {tasks.map((task) => {
                                    const statusColor = TASK_STATUS_COLORS[task.status as ProductionTaskStatus]
                                    const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date()

                                    return (
                                        <tr
                                            key={task.id}
                                            className="hover:bg-obsidian-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-obsidian-900 truncate">
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-xs text-obsidian-500 truncate max-w-[250px]">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    {task.priority > 0 && (
                                                        <span className={`text-[11px] font-medium ${
                                                            task.priority === 2 ? "text-red-600" : "text-orange-600"
                                                        }`}>
                                                            {task.priority === 2 ? "Urgent" : "High Priority"}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <Link
                                                    href={`/admin/bespoke/${task.bespokeOrderId}`}
                                                    className="text-gold-600 hover:text-gold-700 hover:underline font-tabular text-xs"
                                                >
                                                    {task.bespokeOrder.orderNumber}
                                                </Link>
                                                <p className="text-xs text-obsidian-500 truncate max-w-[120px]">
                                                    {task.bespokeOrder.customerName}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-obsidian-50 text-obsidian-600 border border-obsidian-100">
                                                    {STAGE_LABELS[task.stage as ProductionStage] || task.stage}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                                                >
                                                    {TASK_STATUS_LABELS[task.status as ProductionTaskStatus]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                {task.assignedTo ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-obsidian-600">
                                                        <User className="w-3 h-3" />
                                                        {task.assignedTo.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-obsidian-300 text-xs">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                                                {task.dueDate ? (
                                                    <span className={`text-xs inline-flex items-center gap-1 ${
                                                        isOverdue ? "text-red-600 font-medium" : "text-obsidian-600"
                                                    }`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(task.dueDate)}
                                                        {isOverdue && " (overdue)"}
                                                    </span>
                                                ) : (
                                                    <span className="text-obsidian-300 text-xs">--</span>
                                                )}
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
                                        href={`/admin/production?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
                                            stage: stageFilter === "ALL" ? "" : stageFilter,
                                            assignee: assigneeFilter,
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
                                        href={`/admin/production?${buildParams({
                                            status: statusFilter === "ALL" ? "" : statusFilter,
                                            stage: stageFilter === "ALL" ? "" : stageFilter,
                                            assignee: assigneeFilter,
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
