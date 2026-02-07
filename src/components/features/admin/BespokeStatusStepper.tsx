"use client"

import { Check } from "lucide-react"
import {
    BESPOKE_STATUS_ORDER,
    BESPOKE_STATUS_LABELS,
    type BespokeOrderStatus,
} from "@/types/erp"

interface BespokeStatusStepperProps {
    currentStatus: BespokeOrderStatus
}

export default function BespokeStatusStepper({ currentStatus }: BespokeStatusStepperProps) {
    // Filter out CANCELLED from the pipeline view
    const pipelineStatuses = BESPOKE_STATUS_ORDER.filter((s) => s !== "CANCELLED")
    const currentIndex = pipelineStatuses.indexOf(currentStatus as typeof pipelineStatuses[number])
    const isCancelled = currentStatus === "CANCELLED"

    return (
        <div className="w-full">
            {/* Desktop: horizontal stepper */}
            <div className="hidden lg:block">
                <div className="flex items-center">
                    {pipelineStatuses.map((status, index) => {
                        const isPast = !isCancelled && index < currentIndex
                        const isCurrent = !isCancelled && status === currentStatus
                        const isFuture = isCancelled || index > currentIndex

                        return (
                            <div
                                key={status}
                                className="flex items-center flex-1 last:flex-none"
                            >
                                {/* Step circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                                            isPast
                                                ? "bg-green-500 border-green-500 text-white"
                                                : isCurrent
                                                    ? "bg-gold-500 border-gold-500 text-white"
                                                    : "bg-white border-obsidian-200 text-obsidian-400"
                                        }`}
                                    >
                                        {isPast ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] mt-1.5 text-center leading-tight max-w-[72px] ${
                                            isCurrent
                                                ? "text-gold-600 font-semibold"
                                                : isPast
                                                    ? "text-green-600 font-medium"
                                                    : "text-obsidian-400"
                                        }`}
                                    >
                                        {BESPOKE_STATUS_LABELS[status]}
                                    </span>
                                </div>

                                {/* Connector line */}
                                {index < pipelineStatuses.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-1 ${
                                            isPast ? "bg-green-500" : "bg-obsidian-200"
                                        }`}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Mobile: simplified view */}
            <div className="lg:hidden">
                {isCancelled ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-sm">
                        <span className="text-sm font-medium text-red-700">Cancelled</span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-obsidian-900">
                                {BESPOKE_STATUS_LABELS[currentStatus]}
                            </span>
                            <span className="text-obsidian-500">
                                Step {currentIndex + 1} of {pipelineStatuses.length}
                            </span>
                        </div>
                        <div className="w-full bg-obsidian-100 rounded-full h-2">
                            <div
                                className="bg-gold-500 h-2 rounded-full transition-all duration-500"
                                style={{
                                    width: `${((currentIndex + 1) / pipelineStatuses.length) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {pipelineStatuses.map((status, index) => {
                                const isPast = index < currentIndex
                                const isCur = status === currentStatus

                                return (
                                    <span
                                        key={status}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] ${
                                            isCur
                                                ? "bg-gold-50 text-gold-700 border border-gold-200 font-medium"
                                                : isPast
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : "bg-obsidian-50 text-obsidian-400 border border-obsidian-100"
                                        }`}
                                    >
                                        {isPast && <Check className="w-3 h-3" />}
                                        {BESPOKE_STATUS_LABELS[status]}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
