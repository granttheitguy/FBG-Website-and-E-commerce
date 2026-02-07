"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Calendar,
    Clock,
    Plus,
    Ruler,
    FileText,
    MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import BespokeStatusStepper from "@/components/features/admin/BespokeStatusStepper"
import ProductionTaskCard from "@/components/features/admin/ProductionTaskCard"
import ProductionTaskForm, { type TaskFormData } from "@/components/features/admin/ProductionTaskForm"
import {
    advanceBespokeStatus,
    createProductionTask,
    updateProductionTask,
    deleteProductionTask,
} from "../actions"
import {
    BESPOKE_STATUS_ORDER,
    BESPOKE_STATUS_LABELS,
    BESPOKE_STATUS_COLORS,
    type BespokeOrderDetail,
    type BespokeOrderStatus,
    type ProductionTaskDetail,
    type ProductionTaskStatus,
    type StaffMember,
} from "@/types/erp"

interface BespokeOrderDetailClientProps {
    order: BespokeOrderDetail
    staff: StaffMember[]
    currentUserRole: string
}

export default function BespokeOrderDetailClient({
    order,
    staff,
    currentUserRole,
}: BespokeOrderDetailClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Status dialog state
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [newStatus, setNewStatus] = useState<string>("")
    const [statusNote, setStatusNote] = useState("")
    const [statusError, setStatusError] = useState("")

    // Task form state
    const [taskFormOpen, setTaskFormOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<ProductionTaskDetail | null>(null)

    const statusColors = BESPOKE_STATUS_COLORS[order.status]

    const handleAdvanceStatus = () => {
        setStatusError("")
        if (!newStatus) {
            setStatusError("Please select a status")
            return
        }

        startTransition(async () => {
            const result = await advanceBespokeStatus(order.id, {
                status: newStatus,
                note: statusNote || undefined,
            })

            if (result.error) {
                setStatusError(result.error)
            } else {
                setStatusDialogOpen(false)
                setStatusNote("")
                setNewStatus("")
                router.refresh()
            }
        })
    }

    const handleTaskStatusChange = (taskId: string, status: ProductionTaskStatus) => {
        startTransition(async () => {
            await updateProductionTask(taskId, { status })
            router.refresh()
        })
    }

    const handleTaskSubmit = async (data: TaskFormData) => {
        if (editingTask) {
            const result = await updateProductionTask(editingTask.id, {
                title: data.title,
                description: data.description || undefined,
                stage: data.stage,
                status: data.status,
                assignedToId: data.assignedToId || undefined,
                priority: data.priority,
                estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
                dueDate: data.dueDate || undefined,
                notes: data.notes || undefined,
            })
            if (result.error) throw new Error(result.error)
        } else {
            const result = await createProductionTask({
                bespokeOrderId: order.id,
                title: data.title,
                description: data.description || undefined,
                stage: data.stage,
                assignedToId: data.assignedToId || undefined,
                priority: data.priority,
                estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
                dueDate: data.dueDate || undefined,
                notes: data.notes || undefined,
            })
            if (result.error) throw new Error(result.error)
        }
        router.refresh()
    }

    const handleTaskDelete = (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return
        startTransition(async () => {
            await deleteProductionTask(taskId)
            router.refresh()
        })
    }

    const handleEditTask = (task: ProductionTaskDetail) => {
        setEditingTask(task)
        setTaskFormOpen(true)
    }

    // Measurement fields for display
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
        <div className="p-8 max-w-6xl">
            {/* Back link and header */}
            <div className="mb-6">
                <Link
                    href="/admin/bespoke"
                    className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Bespoke Orders
                </Link>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                            {order.orderNumber}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                            >
                                {BESPOKE_STATUS_LABELS[order.status]}
                            </span>
                            <span className="text-sm text-obsidian-500">
                                Created {formatDate(order.createdAt)}
                            </span>
                        </div>
                    </div>

                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <Button
                            variant="primary-gold"
                            size="sm"
                            onClick={() => {
                                setNewStatus("")
                                setStatusNote("")
                                setStatusError("")
                                setStatusDialogOpen(true)
                            }}
                        >
                            Update Status
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Stepper */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6 mb-6">
                <BespokeStatusStepper currentStatus={order.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content - left 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Design & Fabric Notes */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Design & Fabric Details
                        </h2>

                        {order.designDescription ? (
                            <div className="mb-4">
                                <p className="text-xs font-medium text-obsidian-500 mb-1">Design Description</p>
                                <p className="text-sm text-obsidian-700 whitespace-pre-wrap">
                                    {order.designDescription}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-obsidian-400 mb-4">No design description provided.</p>
                        )}

                        {order.fabricDetails && Object.keys(order.fabricDetails).length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-obsidian-500 mb-1">Fabric Details</p>
                                <p className="text-sm text-obsidian-700 whitespace-pre-wrap">
                                    {typeof order.fabricDetails === "string"
                                        ? order.fabricDetails
                                        : JSON.stringify(order.fabricDetails, null, 2)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Production Tasks */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider flex items-center gap-2">
                                Production Tasks ({order.tasks.length})
                            </h2>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setEditingTask(null)
                                    setTaskFormOpen(true)
                                }}
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Task
                            </Button>
                        </div>

                        {order.tasks.length === 0 ? (
                            <p className="text-sm text-obsidian-400 py-4 text-center">
                                No production tasks yet. Add tasks to track the production pipeline.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {order.tasks.map((task) => (
                                    <ProductionTaskCard
                                        key={task.id}
                                        task={task}
                                        onStatusChange={handleTaskStatusChange}
                                        onEdit={handleEditTask}
                                        onDelete={
                                            ["ADMIN", "SUPER_ADMIN"].includes(currentUserRole)
                                                ? handleTaskDelete
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Status Timeline
                        </h2>

                        {order.statusLogs.length === 0 ? (
                            <p className="text-sm text-obsidian-400">No status changes recorded.</p>
                        ) : (
                            <div className="space-y-0">
                                {order.statusLogs.map((log, index) => (
                                    <div
                                        key={log.id}
                                        className="relative flex gap-4 pb-6 last:pb-0"
                                    >
                                        {/* Timeline line */}
                                        {index < order.statusLogs.length - 1 && (
                                            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-obsidian-200" />
                                        )}

                                        {/* Dot */}
                                        <div className="w-6 h-6 rounded-full bg-obsidian-100 border-2 border-obsidian-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-obsidian-400" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {log.oldStatus && (
                                                    <>
                                                        <span className="text-xs text-obsidian-500">
                                                            {BESPOKE_STATUS_LABELS[log.oldStatus as BespokeOrderStatus] || log.oldStatus}
                                                        </span>
                                                        <span className="text-obsidian-400">→</span>
                                                    </>
                                                )}
                                                <span className="text-xs font-medium text-obsidian-900">
                                                    {BESPOKE_STATUS_LABELS[log.newStatus as BespokeOrderStatus] || log.newStatus}
                                                </span>
                                            </div>
                                            {log.note && (
                                                <p className="text-xs text-obsidian-500 mt-0.5 italic">
                                                    &ldquo;{log.note}&rdquo;
                                                </p>
                                            )}
                                            <p className="text-[11px] text-obsidian-400 mt-0.5">
                                                by {log.changedBy.name} &middot; {formatDate(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - right column */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Customer
                        </h2>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-obsidian-900">
                                {order.customerName}
                            </p>
                            <p className="text-sm text-obsidian-600">{order.customerPhone}</p>
                            {order.customerEmail && (
                                <p className="text-sm text-obsidian-600">{order.customerEmail}</p>
                            )}
                            {order.user && (
                                <Link
                                    href={`/admin/customers/${order.user.id}`}
                                    className="inline-flex text-xs text-gold-600 hover:text-gold-700 underline underline-offset-2 mt-1"
                                >
                                    View Customer Profile
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4">
                            Pricing
                        </h2>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Estimated Price</span>
                                <span className="font-tabular font-medium text-obsidian-900">
                                    {order.estimatedPrice ? formatCurrency(order.estimatedPrice) : "--"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Final Price</span>
                                <span className="font-tabular font-medium text-obsidian-900">
                                    {order.finalPrice ? formatCurrency(order.finalPrice) : "--"}
                                </span>
                            </div>
                            <div className="border-t border-obsidian-100 pt-3 flex justify-between text-sm">
                                <span className="text-obsidian-500">Deposit</span>
                                <span className="font-tabular">
                                    {order.depositAmount ? (
                                        <span className={order.depositPaid ? "text-green-600 font-medium" : "text-amber-600"}>
                                            {formatCurrency(order.depositAmount)}
                                            {order.depositPaid ? " (Paid)" : " (Unpaid)"}
                                        </span>
                                    ) : (
                                        <span className="text-obsidian-300">--</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Timeline
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-obsidian-500">Created</span>
                                <span className="text-obsidian-700">{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-obsidian-500">Est. Completion</span>
                                <span className="text-obsidian-700">
                                    {order.estimatedCompletionDate
                                        ? formatDate(order.estimatedCompletionDate)
                                        : "--"}
                                </span>
                            </div>
                            {order.actualCompletionDate && (
                                <div className="flex justify-between">
                                    <span className="text-obsidian-500">Completed</span>
                                    <span className="text-green-600 font-medium">
                                        {formatDate(order.actualCompletionDate)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Measurements */}
                    {order.measurement && (
                        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Ruler className="w-4 h-4" />
                                Measurements ({order.measurement.label})
                            </h2>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {measurementFields.map(({ key, label }) => {
                                    const value = order.measurement?.[key]
                                    if (!value) return null
                                    return (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-obsidian-500">{label}</span>
                                            <span className="font-tabular text-obsidian-700">
                                                {value}{key === "weight" ? "kg" : "cm"}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {(order.internalNotes || order.customerNotes) && (
                        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Notes
                            </h2>

                            {order.customerNotes && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-obsidian-500 mb-1">Customer Notes</p>
                                    <p className="text-sm text-obsidian-700 whitespace-pre-wrap">
                                        {order.customerNotes}
                                    </p>
                                </div>
                            )}

                            {order.internalNotes && (
                                <div>
                                    <p className="text-xs font-medium text-obsidian-500 mb-1">Internal Notes</p>
                                    <p className="text-sm text-obsidian-700 whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-sm p-3">
                                        {order.internalNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Update Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Order Status</DialogTitle>
                        <DialogDescription>
                            Change the status of order {order.orderNumber} from{" "}
                            <strong>{BESPOKE_STATUS_LABELS[order.status]}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {statusError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-sm text-sm">
                                {statusError}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="newStatus">New Status *</Label>
                            <Select
                                value={newStatus}
                                onValueChange={setNewStatus}
                            >
                                <SelectTrigger id="newStatus">
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BESPOKE_STATUS_ORDER
                                        .filter((s) => s !== order.status)
                                        .map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {BESPOKE_STATUS_LABELS[s]}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="statusNote">Note (optional)</Label>
                            <textarea
                                id="statusNote"
                                className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors min-h-[60px] resize-y"
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                placeholder="Add a note about this status change..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setStatusDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary-gold"
                            onClick={handleAdvanceStatus}
                            loading={isPending}
                        >
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Production Task Form Dialog */}
            <ProductionTaskForm
                open={taskFormOpen}
                onClose={() => {
                    setTaskFormOpen(false)
                    setEditingTask(null)
                }}
                onSubmit={handleTaskSubmit}
                task={editingTask}
                bespokeOrderId={order.id}
                staff={staff}
            />
        </div>
    )
}
