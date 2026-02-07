"use client"

import { useState, useTransition } from "react"
import { updateTaskStatus } from "@/app/staff/actions"
import { Button } from "@/components/ui/button"
import {
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    STAGE_LABELS,
    type ProductionTaskDetail,
    type ProductionTaskStatus,
    type ProductionStage,
} from "@/types/erp"
import { formatDate } from "@/lib/utils"
import { Calendar, Clock, User, Play, CheckCircle2, PauseCircle, AlertCircle } from "lucide-react"

interface StaffTaskActionsProps {
    tasks: ProductionTaskDetail[]
    currentUserId: string
}

export default function StaffTaskActions({ tasks, currentUserId }: StaffTaskActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

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

    // Separate my tasks from other tasks
    const myTasks = tasks.filter((t) => t.assignedTo?.id === currentUserId)
    const otherTasks = tasks.filter((t) => t.assignedTo?.id !== currentUserId)

    return (
        <div className="space-y-6">
            {error && (
                <div
                    className="p-3 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* My Tasks */}
            {myTasks.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-obsidian-900 mb-3">My Tasks</h3>
                    <div className="space-y-3">
                        {myTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isOwner={true}
                                isLoading={loadingTaskId === task.id && isPending}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Other Tasks (read only) */}
            {otherTasks.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-obsidian-900 mb-3">Other Tasks</h3>
                    <div className="space-y-3">
                        {otherTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isOwner={false}
                                isLoading={false}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </div>
            )}

            {tasks.length === 0 && (
                <p className="text-sm text-obsidian-400 text-center py-6">
                    No production tasks for this order yet.
                </p>
            )}
        </div>
    )
}

interface TaskCardProps {
    task: ProductionTaskDetail
    isOwner: boolean
    isLoading: boolean
    onStatusChange: (taskId: string, status: ProductionTaskStatus) => void
}

function TaskCard({ task, isOwner, isLoading, onStatusChange }: TaskCardProps) {
    const statusColor = TASK_STATUS_COLORS[task.status]
    const stageLabel = STAGE_LABELS[task.stage as ProductionStage] || task.stage
    const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date()

    return (
        <div className={`border rounded-sm p-4 transition-shadow ${
            isOwner ? "border-emerald-200 bg-emerald-50/30" : "border-obsidian-200 bg-white"
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-obsidian-900">
                            {task.title}
                        </h4>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                        >
                            {TASK_STATUS_LABELS[task.status]}
                        </span>
                    </div>

                    {task.description && (
                        <p className="text-xs text-obsidian-500 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-obsidian-500">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-obsidian-50 rounded-sm">
                            {stageLabel}
                        </span>

                        {task.assignedTo && (
                            <span className="inline-flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignedTo.name}
                            </span>
                        )}

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
                                {task.actualHours ? ` / ${task.actualHours}h actual` : ""}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action buttons for owner's tasks */}
            {isOwner && task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-obsidian-100">
                    {task.status !== "IN_PROGRESS" && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
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
                        onClick={() => onStatusChange(task.id, "COMPLETED")}
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
                            onClick={() => onStatusChange(task.id, "ON_HOLD")}
                            disabled={isLoading}
                            loading={isLoading}
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                            <PauseCircle className="w-3.5 h-3.5 mr-1.5" />
                            Hold
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
