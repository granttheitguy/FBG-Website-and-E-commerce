"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
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
import { createSegment, updateSegment, deleteSegment } from "../customers/actions"
import { formatDate } from "@/lib/utils"
import type { CustomerSegmentWithCount } from "@/types/crm"

interface SegmentListClientProps {
    segments: CustomerSegmentWithCount[]
    canManage: boolean
}

interface SegmentFormData {
    name: string
    description: string
    color: string
    isAutomatic: boolean
}

const INITIAL_FORM: SegmentFormData = {
    name: "",
    description: "",
    color: "#78716C",
    isAutomatic: false,
}

const PRESET_COLORS = [
    "#78716C", "#C8973E", "#3B82F6", "#10B981", "#8B5CF6",
    "#EF4444", "#F59E0B", "#EC4899", "#06B6D4", "#6366F1",
]

export default function SegmentListClient({ segments, canManage }: SegmentListClientProps) {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<SegmentFormData>(INITIAL_FORM)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const openCreateDialog = () => {
        setEditingId(null)
        setForm(INITIAL_FORM)
        setError("")
        setDialogOpen(true)
    }

    const openEditDialog = (segment: CustomerSegmentWithCount) => {
        setEditingId(segment.id)
        setForm({
            name: segment.name,
            description: segment.description || "",
            color: segment.color,
            isAutomatic: segment.isAutomatic,
        })
        setError("")
        setDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = editingId
                ? await updateSegment(editingId, form as unknown as Record<string, unknown>)
                : await createSegment(form as unknown as Record<string, unknown>)

            if (result.error) {
                setError(result.error)
                return
            }

            setDialogOpen(false)
            router.refresh()
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = useCallback(
        async (id: string, name: string) => {
            if (!confirm(`Delete segment "${name}"? This will remove all customers from this segment.`)) {
                return
            }
            await deleteSegment(id)
            router.refresh()
        },
        [router]
    )

    return (
        <>
            {/* Create Button */}
            {canManage && (
                <div className="mb-6">
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Create Segment
                    </Button>
                </div>
            )}

            {/* Segments Grid */}
            {segments.length === 0 ? (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-12 text-center">
                    <Users className="w-10 h-10 text-obsidian-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-obsidian-900 mb-2">No segments yet</h3>
                    <p className="text-sm text-obsidian-500 mb-4 max-w-sm mx-auto">
                        Create segments to group customers for targeted engagement and analysis.
                    </p>
                    {canManage && (
                        <Button size="sm" variant="secondary" onClick={openCreateDialog}>
                            Create your first segment
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map((segment) => (
                        <div
                            key={segment.id}
                            className="bg-white rounded-sm border border-obsidian-200 shadow-sm hover:shadow transition-shadow"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: segment.color }}
                                            aria-hidden="true"
                                        />
                                        <Link
                                            href={`/admin/segments/${segment.id}`}
                                            className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors truncate"
                                        >
                                            {segment.name}
                                        </Link>
                                    </div>
                                    {canManage && (
                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openEditDialog(segment)}
                                                className="p-1.5 text-obsidian-400 hover:text-obsidian-700 hover:bg-obsidian-50 rounded-sm transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                aria-label={`Edit ${segment.name}`}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(segment.id, segment.name)}
                                                className="p-1.5 text-obsidian-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                aria-label={`Delete ${segment.name}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {segment.description && (
                                    <p className="text-sm text-obsidian-500 mt-2 line-clamp-2">
                                        {segment.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-obsidian-100">
                                    <span className="text-sm font-medium text-obsidian-700 font-tabular">
                                        {segment.memberCount} member{segment.memberCount !== 1 ? "s" : ""}
                                    </span>
                                    {segment.isAutomatic && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 font-medium border border-blue-200">
                                            Auto
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="font-serif font-bold tracking-[-0.02em]">
                            {editingId ? "Edit Segment" : "Create Segment"}
                        </DialogTitle>
                        <DialogDescription className="text-obsidian-500">
                            {editingId
                                ? "Update this customer segment."
                                : "Create a new customer segment for grouping."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div
                                className="p-3 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="segment-name">Name</Label>
                            <Input
                                id="segment-name"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. VIP Customers"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="segment-desc">Description</Label>
                            <textarea
                                id="segment-desc"
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Optional description..."
                                rows={2}
                                className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, color: c }))}
                                        className={`w-7 h-7 rounded-sm border-2 transition-all min-w-[28px] min-h-[28px] ${
                                            form.color === c
                                                ? "border-obsidian-900 scale-110"
                                                : "border-transparent hover:border-obsidian-300"
                                        }`}
                                        style={{ backgroundColor: c }}
                                        aria-label={`Select color ${c}`}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                                    className="w-7 h-7 rounded-sm border border-obsidian-200 cursor-pointer"
                                    aria-label="Custom color picker"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDialogOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={loading}>
                                {editingId ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
