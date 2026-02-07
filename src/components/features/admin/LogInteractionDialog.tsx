"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { InteractionFormData, InteractionType } from "@/types/crm"

interface LogInteractionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: InteractionFormData) => Promise<void>
}

const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
    { value: "CALL", label: "Phone Call" },
    { value: "EMAIL", label: "Email" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "VISIT", label: "Store Visit" },
    { value: "NOTE", label: "Note" },
    { value: "PURCHASE", label: "Purchase" },
    { value: "RETURN", label: "Return" },
]

const INITIAL_FORM: InteractionFormData = {
    type: "NOTE",
    subject: "",
    description: "",
}

export default function LogInteractionDialog({
    open,
    onOpenChange,
    onSubmit,
}: LogInteractionDialogProps) {
    const [form, setForm] = useState<InteractionFormData>(INITIAL_FORM)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setForm(INITIAL_FORM)
            setError("")
        }
        onOpenChange(nextOpen)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.description.trim()) {
            setError("Description is required")
            return
        }

        setLoading(true)
        setError("")

        try {
            await onSubmit(form)
            onOpenChange(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to log interaction"
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="font-serif font-bold tracking-[-0.02em]">
                        Log Interaction
                    </DialogTitle>
                    <DialogDescription className="text-obsidian-500">
                        Record a customer interaction for CRM tracking.
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

                    {/* Type Select */}
                    <div className="space-y-1">
                        <Label htmlFor="interaction-type">Type</Label>
                        <select
                            id="interaction-type"
                            value={form.type}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    type: e.target.value as InteractionType,
                                }))
                            }
                            className="flex h-12 w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                        >
                            {INTERACTION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                        <Label htmlFor="interaction-subject">
                            Subject <span className="text-obsidian-400">(optional)</span>
                        </Label>
                        <Input
                            id="interaction-subject"
                            value={form.subject}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, subject: e.target.value }))
                            }
                            placeholder="Brief summary"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <Label htmlFor="interaction-description">Description</Label>
                        <textarea
                            id="interaction-description"
                            value={form.description}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            required
                            rows={4}
                            placeholder="Details about this interaction..."
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            Log Interaction
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
