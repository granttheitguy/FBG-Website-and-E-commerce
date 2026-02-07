"use client"

import { useState } from "react"
import { logCustomerInteraction } from "@/app/staff/actions"
import LogInteractionDialog from "@/components/features/admin/LogInteractionDialog"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Plus, Phone, Mail, MessageCircle, MapPin, StickyNote, ShoppingBag, RotateCcw } from "lucide-react"
import type { CustomerInteraction, InteractionFormData, InteractionType } from "@/types/crm"

interface StaffCustomerInteractionsProps {
    customerId: string
    interactions: CustomerInteraction[]
}

const INTERACTION_ICONS: Record<InteractionType, React.ElementType> = {
    CALL: Phone,
    EMAIL: Mail,
    WHATSAPP: MessageCircle,
    VISIT: MapPin,
    NOTE: StickyNote,
    PURCHASE: ShoppingBag,
    RETURN: RotateCcw,
}

const INTERACTION_LABELS: Record<InteractionType, string> = {
    CALL: "Phone Call",
    EMAIL: "Email",
    WHATSAPP: "WhatsApp",
    VISIT: "Store Visit",
    NOTE: "Note",
    PURCHASE: "Purchase",
    RETURN: "Return",
}

export default function StaffCustomerInteractions({
    customerId,
    interactions,
}: StaffCustomerInteractionsProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogInteraction = async (formData: InteractionFormData) => {
        setError(null)

        const result = await logCustomerInteraction(customerId, {
            type: formData.type,
            subject: formData.subject,
            description: formData.description,
        })

        if (result.error) {
            throw new Error(result.error)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-obsidian-900">Interactions</h2>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDialogOpen(true)}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Log Interaction
                </Button>
            </div>

            {error && (
                <div
                    className="p-3 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700 mb-4"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* Interaction List */}
            {interactions.length === 0 ? (
                <p className="text-sm text-obsidian-400 text-center py-8">
                    No interactions recorded yet. Log your first interaction above.
                </p>
            ) : (
                <ul className="space-y-3">
                    {interactions.map((interaction) => {
                        const Icon = INTERACTION_ICONS[interaction.type] || StickyNote
                        return (
                            <li
                                key={interaction.id}
                                className="flex gap-3 p-3 border border-obsidian-100 rounded-sm"
                            >
                                <div className="w-8 h-8 rounded-full bg-obsidian-50 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-obsidian-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-obsidian-700 px-1.5 py-0.5 bg-obsidian-50 rounded-sm">
                                            {INTERACTION_LABELS[interaction.type]}
                                        </span>
                                        {interaction.subject && (
                                            <span className="text-sm font-medium text-obsidian-900 truncate">
                                                {interaction.subject}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-obsidian-600 mt-1 line-clamp-3">
                                        {interaction.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-obsidian-400">
                                        {interaction.staff && (
                                            <span>{interaction.staff.name}</span>
                                        )}
                                        <span>{formatDate(interaction.createdAt)}</span>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* Log Interaction Dialog */}
            <LogInteractionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleLogInteraction}
            />
        </div>
    )
}
