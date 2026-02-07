"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
    STAGE_LABELS,
    TASK_STATUS_LABELS,
    type ProductionTaskDetail,
    type ProductionStage,
    type ProductionTaskStatus,
    type StaffMember,
} from "@/types/erp"

interface ProductionTaskFormProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: TaskFormData) => Promise<void>
    task?: ProductionTaskDetail | null
    bespokeOrderId: string
    staff: StaffMember[]
}

export interface TaskFormData {
    title: string
    description: string
    stage: string
    status?: string
    assignedToId: string
    priority: number
    estimatedHours: string
    dueDate: string
    notes: string
}

export default function ProductionTaskForm({
    open,
    onClose,
    onSubmit,
    task,
    bespokeOrderId,
    staff,
}: ProductionTaskFormProps) {
    const isEdit = !!task
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [form, setForm] = useState<TaskFormData>({
        title: "",
        description: "",
        stage: "CUTTING",
        status: undefined,
        assignedToId: "",
        priority: 0,
        estimatedHours: "",
        dueDate: "",
        notes: "",
    })

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title,
                description: task.description || "",
                stage: task.stage,
                status: task.status,
                assignedToId: task.assignedTo?.id || "",
                priority: task.priority,
                estimatedHours: task.estimatedHours?.toString() || "",
                dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
                notes: task.notes || "",
            })
        } else {
            setForm({
                title: "",
                description: "",
                stage: "CUTTING",
                status: undefined,
                assignedToId: "",
                priority: 0,
                estimatedHours: "",
                dueDate: "",
                notes: "",
            })
        }
        setError("")
    }, [task, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await onSubmit(form)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save task")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Task" : "Add Production Task"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the production task details."
                            : "Create a new production task for this bespoke order."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-sm text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="taskTitle">Title *</Label>
                        <Input
                            id="taskTitle"
                            required
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="e.g., Cut bodice pieces"
                        />
                    </div>

                    <div>
                        <Label htmlFor="taskDescription">Description</Label>
                        <textarea
                            id="taskDescription"
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors min-h-[60px] resize-y"
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Task details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="taskStage">Stage *</Label>
                            <Select
                                value={form.stage}
                                onValueChange={(v) => setForm((p) => ({ ...p, stage: v }))}
                            >
                                <SelectTrigger id="taskStage">
                                    <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(STAGE_LABELS) as ProductionStage[]).map((stage) => (
                                        <SelectItem key={stage} value={stage}>
                                            {STAGE_LABELS[stage]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {isEdit && (
                            <div>
                                <Label htmlFor="taskStatus">Status</Label>
                                <Select
                                    value={form.status || "NOT_STARTED"}
                                    onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                                >
                                    <SelectTrigger id="taskStatus">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(TASK_STATUS_LABELS) as ProductionTaskStatus[]).map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {TASK_STATUS_LABELS[status]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="taskPriority">Priority</Label>
                            <Select
                                value={form.priority.toString()}
                                onValueChange={(v) => setForm((p) => ({ ...p, priority: parseInt(v, 10) }))}
                            >
                                <SelectTrigger id="taskPriority">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Normal</SelectItem>
                                    <SelectItem value="1">High</SelectItem>
                                    <SelectItem value="2">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="taskAssignee">Assign To</Label>
                        <Select
                            value={form.assignedToId || "unassigned"}
                            onValueChange={(v) => setForm((p) => ({ ...p, assignedToId: v === "unassigned" ? "" : v }))}
                        >
                            <SelectTrigger id="taskAssignee">
                                <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {staff.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="taskEstHours">Estimated Hours</Label>
                            <Input
                                id="taskEstHours"
                                type="number"
                                min="0"
                                step="0.5"
                                value={form.estimatedHours}
                                onChange={(e) => setForm((p) => ({ ...p, estimatedHours: e.target.value }))}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <Label htmlFor="taskDueDate">Due Date</Label>
                            <Input
                                id="taskDueDate"
                                type="date"
                                value={form.dueDate}
                                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="taskNotes">Notes</Label>
                        <textarea
                            id="taskNotes"
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors min-h-[60px] resize-y"
                            value={form.notes}
                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                            placeholder="Additional notes..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEdit ? "Update Task" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
