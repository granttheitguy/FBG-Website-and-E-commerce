"use client"

import { useState } from "react"
import { Calendar, Clock, User, MoreVertical } from "lucide-react"
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

interface ProductionTaskCardProps {
    task: ProductionTaskDetail
    onStatusChange: (taskId: string, status: ProductionTaskStatus) => void
    onEdit: (task: ProductionTaskDetail) => void
    onDelete?: (taskId: string) => void
    showOrderInfo?: boolean
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: "Normal", color: "text-obsidian-500" },
    1: { label: "High", color: "text-orange-600" },
    2: { label: "Urgent", color: "text-red-600" },
}

export default function ProductionTaskCard({
    task,
    onStatusChange,
    onEdit,
    onDelete,
    showOrderInfo = false,
}: ProductionTaskCardProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const statusColor = TASK_STATUS_COLORS[task.status]
    const stageLabel = STAGE_LABELS[task.stage as ProductionStage] || task.stage
    const priorityInfo = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS[0]
    const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date()

    return (
        <div className="bg-white border border-obsidian-200 rounded-sm p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-obsidian-900 truncate">
                            {task.title}
                        </h4>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                        >
                            {TASK_STATUS_LABELS[task.status]}
                        </span>
                        {task.priority > 0 && (
                            <span className={`text-[11px] font-medium ${priorityInfo.color}`}>
                                {priorityInfo.label}
                            </span>
                        )}
                    </div>

                    {task.description && (
                        <p className="text-xs text-obsidian-500 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {showOrderInfo && task.bespokeOrder && (
                        <p className="text-xs text-obsidian-500 mt-1">
                            Order:{" "}
                            <a
                                href={`/admin/bespoke/${task.bespokeOrderId}`}
                                className="text-gold-600 hover:underline"
                            >
                                {task.bespokeOrder.orderNumber}
                            </a>
                            {" - "}
                            {task.bespokeOrder.customerName}
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

                {/* Actions */}
                <div className="relative flex-shrink-0">
                    <button
                        type="button"
                        className="p-1.5 text-obsidian-400 hover:text-obsidian-600 hover:bg-obsidian-50 rounded-sm transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Task actions"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-obsidian-200 rounded-sm shadow-lg min-w-[160px]">
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-obsidian-50 transition-colors"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        onEdit(task)
                                    }}
                                >
                                    Edit Task
                                </button>
                                {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-obsidian-50 transition-colors text-blue-600"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onStatusChange(task.id, "IN_PROGRESS")
                                        }}
                                    >
                                        Start Task
                                    </button>
                                )}
                                {task.status !== "COMPLETED" && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-obsidian-50 transition-colors text-green-600"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onStatusChange(task.id, "COMPLETED")
                                        }}
                                    >
                                        Mark Complete
                                    </button>
                                )}
                                {task.status !== "ON_HOLD" && task.status !== "COMPLETED" && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-obsidian-50 transition-colors text-amber-600"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onStatusChange(task.id, "ON_HOLD")
                                        }}
                                    >
                                        Put On Hold
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors text-red-600 border-t border-obsidian-100"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onDelete(task.id)
                                        }}
                                    >
                                        Delete Task
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
