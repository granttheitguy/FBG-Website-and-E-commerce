"use client"

import { Phone, Mail, MessageSquare, MapPin, StickyNote, ShoppingBag, RotateCcw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { CustomerInteraction, InteractionType } from "@/types/crm"

interface CustomerInteractionTimelineProps {
    interactions: CustomerInteraction[]
}

const INTERACTION_CONFIG: Record<InteractionType, {
    icon: typeof Phone
    label: string
    colorClasses: string
}> = {
    CALL: {
        icon: Phone,
        label: "Phone Call",
        colorClasses: "bg-blue-50 text-blue-600 border-blue-200",
    },
    EMAIL: {
        icon: Mail,
        label: "Email",
        colorClasses: "bg-purple-50 text-purple-600 border-purple-200",
    },
    WHATSAPP: {
        icon: MessageSquare,
        label: "WhatsApp",
        colorClasses: "bg-green-50 text-green-600 border-green-200",
    },
    VISIT: {
        icon: MapPin,
        label: "Store Visit",
        colorClasses: "bg-amber-50 text-amber-600 border-amber-200",
    },
    NOTE: {
        icon: StickyNote,
        label: "Note",
        colorClasses: "bg-obsidian-50 text-obsidian-600 border-obsidian-200",
    },
    PURCHASE: {
        icon: ShoppingBag,
        label: "Purchase",
        colorClasses: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    RETURN: {
        icon: RotateCcw,
        label: "Return",
        colorClasses: "bg-red-50 text-red-600 border-red-200",
    },
}

export default function CustomerInteractionTimeline({
    interactions,
}: CustomerInteractionTimelineProps) {
    if (interactions.length === 0) {
        return (
            <div className="text-center py-8">
                <StickyNote className="w-8 h-8 text-obsidian-300 mx-auto mb-3" />
                <p className="text-sm text-obsidian-500">No interactions recorded yet.</p>
            </div>
        )
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8" role="list" aria-label="Customer interaction timeline">
                {interactions.map((interaction, index) => {
                    const config = INTERACTION_CONFIG[interaction.type]
                    const Icon = config.icon
                    const isLast = index === interactions.length - 1

                    return (
                        <li key={interaction.id} role="listitem">
                            <div className="relative pb-8">
                                {!isLast && (
                                    <span
                                        className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-obsidian-100"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="relative flex items-start gap-3">
                                    <div
                                        className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${config.colorClasses}`}
                                    >
                                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xs font-medium text-obsidian-700 rounded-sm px-1.5 py-0.5 bg-obsidian-50 border border-obsidian-100">
                                                    {config.label}
                                                </span>
                                                {interaction.subject && (
                                                    <span className="text-sm font-medium text-obsidian-900 truncate">
                                                        {interaction.subject}
                                                    </span>
                                                )}
                                            </div>
                                            <time
                                                dateTime={interaction.createdAt}
                                                className="text-xs text-obsidian-400 whitespace-nowrap flex-shrink-0"
                                            >
                                                {formatDate(interaction.createdAt)}
                                            </time>
                                        </div>
                                        <p className="mt-1 text-sm text-obsidian-600 whitespace-pre-line">
                                            {interaction.description}
                                        </p>
                                        {interaction.staff && (
                                            <p className="mt-1 text-xs text-obsidian-400">
                                                by {interaction.staff.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
