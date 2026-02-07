"use client"

import { useTransition } from "react"
import { updateConsultationStatus } from "../actions"

type ConsultationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

interface ConsultationStatusSelectProps {
    bookingId: string
    currentStatus: string
}

const STATUS_OPTIONS: { value: ConsultationStatus; label: string }[] = [
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
]

const STATUS_STYLES: Record<string, string> = {
    PENDING: "border-yellow-300 bg-yellow-50 text-yellow-800",
    CONFIRMED: "border-blue-300 bg-blue-50 text-blue-800",
    COMPLETED: "border-green-300 bg-green-50 text-green-800",
    CANCELLED: "border-red-300 bg-red-50 text-red-800",
}

export function ConsultationStatusSelect({ bookingId, currentStatus }: ConsultationStatusSelectProps) {
    const [isPending, startTransition] = useTransition()

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newStatus = e.target.value as ConsultationStatus
        if (newStatus === currentStatus) return

        startTransition(async () => {
            const result = await updateConsultationStatus(bookingId, newStatus)
            if (result.error) {
                alert(result.error)
            }
        })
    }

    return (
        <select
            value={currentStatus}
            onChange={handleChange}
            disabled={isPending}
            aria-label="Update consultation status"
            className={`rounded-sm border px-3 py-2 text-sm font-medium transition-colors min-h-[44px] disabled:opacity-50 ${
                STATUS_STYLES[currentStatus] || "border-obsidian-300 bg-white text-obsidian-900"
            }`}
        >
            {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    )
}
