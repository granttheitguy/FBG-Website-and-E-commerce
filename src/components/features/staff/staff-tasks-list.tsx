"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { updateTaskStatus } from "@/app/staff/actions"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    STAGE_LABELS,
    type ProductionTaskDetail,
    type ProductionTaskStatus,
    type ProductionStage,
} from "@/types/erp"
import {
    Calendar,
    Clock,
    Play,
    CheckCircle2,
    PauseCircle,
    ClipboardList,
    AlertCircle,
} from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"

interface StaffTasksListProps {
    tasks: ProductionTaskDetail[]
}

const STATUS_FILTERS: { value: string; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "COMPLETED", label: "Completed" },
]

export default function StaffTasksList({ tasks: initialTasks }: StaffTasksListProps) {
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [isPending, startTransition] = useTransition()
    const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const filteredTasks = statusFilter === "ALL"
        ? initialTasks
        : initialTasks.filter((t) => t.status === statusFilter)

    const handleStatusChange = (taskId: string, newStatus: ProductionTaskStatus) => {
        setLoadingTaskId(taskId)
        setError(null)

        startTransition(async () => {
            const result = await updateTaskStatus(taskId, newStatus)
            setLoadingTaskId(null)

            if (result.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div>
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((filter) => {
                    const count = filter.value === "ALL"
                        ? initialTasks.length
                        : initialTasks.filter((t) => t.status === filter.value).length

                    return (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => setStatusFilter(filter.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                                statusFilter === filter.value
                                    ? "bg-emerald-600 text-white"
                                    : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                            }`}
                            aria-pressed={statusFilter === filter.value}
                        >
                            {filter.label}
                            <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                                statusFilter === filter.value
                                    ? "bg-white/20"
                                    : "bg-obsidian-200/60"
                            }`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {error && (
                <div
                    className="p-3 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700 mb-4"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* Tasks */}
            {filteredTasks.length === 0 ? (
                <EmptyState
                    icon={<ClipboardList className="w-8 h-8" />}
                    title="No tasks found"
                    description={
                        statusFilter === "ALL"
                            ? "You have no production tasks assigned to you."
                            : `No tasks with status "${TASK_STATUS_LABELS[statusFilter as ProductionTaskStatus]}".`
                    }
                />
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task) => {
                        const statusColor = TASK_STATUS_COLORS[task.status]
                        const stageLabel = STAGE_LABELS[task.stage as ProductionStage] || task.stage
                        const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date()
                        const isLoading = loadingTaskId === task.id && isPending

                        return (
                            <div
                                key={task.id}
                                className="bg-white border border-obsidian-200 rounded-sm p-4 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-medium text-obsidian-900">
                                                {task.title}
                                            </h3>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                                            >
                                                {TASK_STATUS_LABELS[task.status]}
                                            </span>
                                            {task.priority > 0 && (
                                                <span className={`text-[11px] font-medium ${
                                                    task.priority === 2 ? "text-red-600" : "text-orange-600"
                                                }`}>
                                                    {task.priority === 2 ? "Urgent" : "High"}
                                                </span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-xs text-obsidian-500 mt-1 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        {/* Order info */}
                                        {task.bespokeOrder && (
                                            <p className="text-xs text-obsidian-500 mt-1">
                                                Order:{" "}
                                                <Link
                                                    href={`/staff/bespoke/${task.bespokeOrderId}`}
                                                    className="text-emerald-600 hover:underline"
                                                >
                                                    {task.bespokeOrder.orderNumber}
                                                </Link>
                                                {" - "}
                                                {task.bespokeOrder.customerName}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 text-xs text-obsidian-500">
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-obsidian-50 rounded-sm">
                                                {stageLabel}
                                            </span>

                                            {task.dueDate && (
                                                <span
                                                    className={`inline-flex items-center gap-1 ${
                                                        isOverdue ? "text-red-600 font-medium" : ""
                                                    }`}
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(task.dueDate)}
                                                    {isOverdue && " (overdue)"}
                                                </span>
                                            )}

                                            {task.estimatedHours && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {task.estimatedHours}h est.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Overdue indicator */}
                                    {isOverdue && (
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    )}
                                </div>

                                {/* Action buttons */}
                                {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-obsidian-100">
                                        {task.status !== "IN_PROGRESS" && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                                                disabled={isLoading}
                                                loading={isLoading}
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                                <Play className="w-3.5 h-3.5 mr-1.5" />
                                                Start
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleStatusChange(task.id, "COMPLETED")}
                                            disabled={isLoading}
                                            loading={isLoading}
                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                            Complete
                                        </Button>
                                        {task.status !== "ON_HOLD" && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleStatusChange(task.id, "ON_HOLD")}
                                                disabled={isLoading}
                                                loading={isLoading}
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                            >
                                                <PauseCircle className="w-3.5 h-3.5 mr-1.5" />
                                                Hold
                                            </Button>
                                        )}
                                        <Link
                                            href={`/staff/bespoke/${task.bespokeOrderId}`}
                                            className="ml-auto text-xs text-obsidian-500 hover:text-obsidian-900 transition-colors"
                                        >
                                            View order
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
