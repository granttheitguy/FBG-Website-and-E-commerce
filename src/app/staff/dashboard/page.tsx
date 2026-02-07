import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
    ClipboardList,
    ShoppingBag,
    Scissors,
    MessageCircle,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
} from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import {
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    type ProductionTaskStatus,
} from "@/types/erp"

export default async function StaffDashboardPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/staff/login")
    }

    const userId = session.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch dashboard data in parallel
    const [
        myTasksToday,
        pendingOrders,
        activeBespokeOrders,
        recentInteractions,
        topTasks,
        recentOrders,
    ] = await Promise.all([
        // Tasks due today or overdue assigned to current user
        prisma.productionTask.count({
            where: {
                assignedToId: userId,
                status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
                OR: [
                    { dueDate: { lte: tomorrow } },
                    { dueDate: null },
                ],
            },
        }),
        // Pending orders count
        prisma.order.count({
            where: { status: "PENDING" },
        }),
        // Active bespoke orders (not delivered/cancelled)
        prisma.bespokeOrder.count({
            where: {
                status: { notIn: ["DELIVERED", "CANCELLED"] },
                tasks: { some: { assignedToId: userId } },
            },
        }),
        // Recent interactions by this staff member (last 7 days)
        prisma.customerInteraction.count({
            where: {
                staffUserId: userId,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
        }),
        // Top 5 tasks for this user
        prisma.productionTask.findMany({
            where: {
                assignedToId: userId,
                status: { in: ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD"] },
            },
            orderBy: [
                { priority: "desc" },
                { dueDate: "asc" },
            ],
            take: 5,
            include: {
                bespokeOrder: {
                    select: { id: true, orderNumber: true, customerName: true },
                },
            },
        }),
        // Recent 5 pending/processing orders
        prisma.order.findMany({
            where: { status: { in: ["PENDING", "PROCESSING"] } },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                user: { select: { name: true, email: true } },
            },
        }),
    ])

    const statCards = [
        {
            label: "My Tasks Today",
            value: myTasksToday,
            icon: ClipboardList,
            href: "/staff/tasks",
            color: "bg-emerald-50 text-emerald-700",
            iconColor: "text-emerald-600",
        },
        {
            label: "Pending Orders",
            value: pendingOrders,
            icon: ShoppingBag,
            href: "/staff/orders",
            color: "bg-amber-50 text-amber-700",
            iconColor: "text-amber-600",
        },
        {
            label: "Active Bespoke Orders",
            value: activeBespokeOrders,
            icon: Scissors,
            href: "/staff/bespoke",
            color: "bg-blue-50 text-blue-700",
            iconColor: "text-blue-600",
        },
        {
            label: "Recent Interactions",
            value: recentInteractions,
            icon: MessageCircle,
            href: "/staff/interactions",
            color: "bg-purple-50 text-purple-700",
            iconColor: "text-purple-600",
        },
    ]

    return (
        <div className="p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    Welcome back, {session.user.name}
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    Here is your staff dashboard overview for today.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="bg-white rounded-sm border border-obsidian-200 p-5 hover:shadow-sm transition-shadow group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${card.color}`}>
                                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                </div>
                                <ArrowRight className="w-4 h-4 text-obsidian-300 group-hover:text-emerald-600 transition-colors" />
                            </div>
                            <p className="text-2xl font-bold font-tabular text-obsidian-900">
                                {card.value}
                            </p>
                            <p className="text-sm text-obsidian-500 mt-0.5">{card.label}</p>
                        </Link>
                    )
                })}
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* My Tasks */}
                <div className="bg-white rounded-sm border border-obsidian-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-100">
                        <h2 className="text-base font-semibold text-obsidian-900">My Tasks</h2>
                        <Link
                            href="/staff/tasks"
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                            View all
                        </Link>
                    </div>
                    {topTasks.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                icon={<CheckCircle2 className="w-8 h-8" />}
                                title="All caught up"
                                description="You have no pending tasks assigned to you right now."
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-obsidian-100">
                            {topTasks.map((task) => {
                                const statusColor = TASK_STATUS_COLORS[task.status as ProductionTaskStatus]
                                const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date()
                                return (
                                    <li key={task.id}>
                                        <Link
                                            href={`/staff/bespoke/${task.bespokeOrderId}`}
                                            className="flex items-start gap-3 px-5 py-3.5 hover:bg-obsidian-50/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-obsidian-900 truncate">
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-obsidian-500 mt-0.5">
                                                    {task.bespokeOrder.orderNumber} - {task.bespokeOrder.customerName}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isOverdue && (
                                                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Overdue
                                                    </span>
                                                )}
                                                {task.dueDate && !isOverdue && (
                                                    <span className="text-xs text-obsidian-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(task.dueDate)}
                                                    </span>
                                                )}
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                                                >
                                                    {TASK_STATUS_LABELS[task.status as ProductionTaskStatus]}
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-sm border border-obsidian-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-100">
                        <h2 className="text-base font-semibold text-obsidian-900">Recent Orders</h2>
                        <Link
                            href="/staff/orders"
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                            View all
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                icon={<ShoppingBag className="w-8 h-8" />}
                                title="No pending orders"
                                description="There are no orders requiring attention at this time."
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-obsidian-100">
                            {recentOrders.map((order) => (
                                <li key={order.id}>
                                    <Link
                                        href={`/staff/orders/${order.id}`}
                                        className="flex items-center justify-between px-5 py-3.5 hover:bg-obsidian-50/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-obsidian-900 font-tabular">
                                                #{order.orderNumber}
                                            </p>
                                            <p className="text-xs text-obsidian-500 mt-0.5 truncate">
                                                {order.user?.name || order.customerEmail || "Guest"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-sm font-medium font-tabular text-obsidian-900">
                                                {formatCurrency(order.total)}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium ${
                                                order.status === "PENDING"
                                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
