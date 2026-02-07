import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, User, Phone, Mail, Ruler } from "lucide-react"
import BespokeStatusStepper from "@/components/features/admin/BespokeStatusStepper"
import StaffTaskActions from "@/components/features/staff/staff-task-actions"
import {
    BESPOKE_STATUS_LABELS,
    BESPOKE_STATUS_COLORS,
    type BespokeOrderStatus,
    type ProductionTaskDetail,
} from "@/types/erp"

export default async function StaffBespokeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user) {
        redirect("/staff/login")
    }

    const { id } = await params

    const order = await prisma.bespokeOrder.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            measurement: true,
            tasks: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                include: {
                    assignedTo: { select: { id: true, name: true } },
                },
            },
            statusLogs: {
                orderBy: { createdAt: "desc" },
                include: {
                    changedBy: { select: { id: true, name: true } },
                },
            },
        },
    })

    if (!order) {
        notFound()
    }

    const status = order.status as BespokeOrderStatus
    const colors = BESPOKE_STATUS_COLORS[status]

    // Serialize dates for client components
    const serializedTasks: ProductionTaskDetail[] = order.tasks.map((task) => ({
        id: task.id,
        bespokeOrderId: task.bespokeOrderId,
        title: task.title,
        description: task.description,
        stage: task.stage,
        status: task.status as ProductionTaskDetail["status"],
        priority: task.priority,
        sortOrder: task.sortOrder,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        dueDate: task.dueDate?.toISOString() ?? null,
        completedAt: task.completedAt?.toISOString() ?? null,
        notes: task.notes,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        assignedTo: task.assignedTo,
    }))

    const measurementFields = [
        { key: "chest", label: "Chest" },
        { key: "shoulder", label: "Shoulder" },
        { key: "sleeveLength", label: "Sleeve Length" },
        { key: "neck", label: "Neck" },
        { key: "backLength", label: "Back Length" },
        { key: "waist", label: "Waist" },
        { key: "hip", label: "Hip" },
        { key: "inseam", label: "Inseam" },
        { key: "outseam", label: "Outseam" },
        { key: "thigh", label: "Thigh" },
        { key: "height", label: "Height" },
        { key: "weight", label: "Weight" },
    ] as const

    return (
        <div className="p-6 lg:p-8">
            {/* Back link */}
            <Link
                href="/staff/bespoke"
                className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Bespoke Orders
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        {order.orderNumber}
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {order.customerName} - Created {formatDate(order.createdAt)}
                    </p>
                </div>
                <span
                    className={`self-start inline-flex items-center px-3 py-1 rounded-sm text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                >
                    {BESPOKE_STATUS_LABELS[status]}
                </span>
            </div>

            {/* Status Stepper */}
            <div className="bg-white rounded-sm border border-obsidian-200 p-5 mb-6">
                <BespokeStatusStepper currentStatus={status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content area - tasks */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Production Tasks */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100">
                            <h2 className="text-base font-semibold text-obsidian-900">
                                Production Tasks ({order.tasks.length})
                            </h2>
                            <p className="text-xs text-obsidian-500 mt-0.5">
                                You can update the status of tasks assigned to you.
                            </p>
                        </div>
                        <div className="p-5">
                            <StaffTaskActions
                                tasks={serializedTasks}
                                currentUserId={session.user.id}
                            />
                        </div>
                    </div>

                    {/* Status Timeline */}
                    {order.statusLogs.length > 0 && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100">
                                <h2 className="text-base font-semibold text-obsidian-900">Status Timeline</h2>
                            </div>
                            <ul className="divide-y divide-obsidian-100">
                                {order.statusLogs.map((log) => {
                                    const newStatus = log.newStatus as BespokeOrderStatus
                                    const logColors = BESPOKE_STATUS_COLORS[newStatus] || BESPOKE_STATUS_COLORS.INQUIRY

                                    return (
                                        <li key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-obsidian-500">
                                                        {BESPOKE_STATUS_LABELS[log.oldStatus as BespokeOrderStatus] || log.oldStatus}
                                                    </span>
                                                    <span className="text-obsidian-300">-&gt;</span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${logColors.bg} ${logColors.text} ${logColors.border}`}
                                                    >
                                                        {BESPOKE_STATUS_LABELS[newStatus] || log.newStatus}
                                                    </span>
                                                </div>
                                                {log.note && (
                                                    <p className="text-xs text-obsidian-500 mt-0.5">{log.note}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-obsidian-500">{log.changedBy.name}</p>
                                                <p className="text-xs text-obsidian-400">{formatDate(log.createdAt)}</p>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right column - Info panels */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100">
                            <h2 className="text-base font-semibold text-obsidian-900">Customer</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-obsidian-400" />
                                <span className="text-sm font-medium text-obsidian-900">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-obsidian-400" />
                                <span className="text-sm text-obsidian-600">{order.customerPhone}</span>
                            </div>
                            {order.customerEmail && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-obsidian-400" />
                                    <span className="text-sm text-obsidian-600">{order.customerEmail}</span>
                                </div>
                            )}
                            {order.user && (
                                <Link
                                    href={`/staff/customers/${order.user.id}`}
                                    className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors mt-1"
                                >
                                    View customer profile
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100">
                            <h2 className="text-base font-semibold text-obsidian-900">Pricing</h2>
                        </div>
                        <div className="px-5 py-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Estimated Price</span>
                                <span className="font-tabular text-obsidian-900">
                                    {order.estimatedPrice ? formatCurrency(order.estimatedPrice) : "--"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Final Price</span>
                                <span className="font-tabular text-obsidian-900">
                                    {order.finalPrice ? formatCurrency(order.finalPrice) : "--"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Deposit</span>
                                <span className="font-tabular">
                                    {order.depositAmount ? (
                                        <span className={order.depositPaid ? "text-green-600" : "text-amber-600"}>
                                            {formatCurrency(order.depositAmount)}
                                            {order.depositPaid && " (Paid)"}
                                        </span>
                                    ) : (
                                        <span className="text-obsidian-300">--</span>
                                    )}
                                </span>
                            </div>
                            {order.estimatedCompletionDate && (
                                <div className="flex justify-between text-sm pt-2 border-t border-obsidian-100">
                                    <span className="text-obsidian-500">Est. Completion</span>
                                    <span className="text-obsidian-900">
                                        {formatDate(order.estimatedCompletionDate)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Design Details */}
                    {order.designDescription && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100">
                                <h2 className="text-base font-semibold text-obsidian-900">Design Details</h2>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm text-obsidian-600 whitespace-pre-wrap">
                                    {order.designDescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Measurements */}
                    {order.measurement && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-obsidian-400" />
                                <h2 className="text-base font-semibold text-obsidian-900">
                                    Measurements
                                </h2>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-xs text-obsidian-500 mb-3">
                                    Profile: {order.measurement.label}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {measurementFields.map(({ key, label }) => {
                                        const value = order.measurement![key as keyof typeof order.measurement]
                                        if (!value || value === 0) return null
                                        return (
                                            <div key={key} className="flex justify-between text-sm">
                                                <span className="text-obsidian-500">{label}</span>
                                                <span className="font-tabular text-obsidian-900">
                                                    {String(value)} cm
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer Notes (read-only) */}
                    {order.customerNotes && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100">
                                <h2 className="text-base font-semibold text-obsidian-900">Customer Notes</h2>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm text-obsidian-600 whitespace-pre-wrap">
                                    {order.customerNotes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
