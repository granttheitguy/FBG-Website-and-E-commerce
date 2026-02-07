"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "lucide-react"
import { useState } from "react"

interface DatePreset {
    label: string
    days: number | null // null means "All Time"
}

const DATE_PRESETS: DatePreset[] = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
    { label: "All Time", days: null },
]

export function DateRangeFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "")
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "")

    const handlePresetClick = (days: number | null) => {
        const params = new URLSearchParams(searchParams.toString())

        if (days === null) {
            // All Time - remove date filters
            params.delete("startDate")
            params.delete("endDate")
        } else {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - days)

            const startStr = start.toISOString().split("T")[0]
            const endStr = end.toISOString().split("T")[0]

            params.set("startDate", startStr)
            params.set("endDate", endStr)

            setStartDate(startStr)
            setEndDate(endStr)
        }

        router.push(`?${params.toString()}`)
    }

    const handleCustomDateChange = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (startDate) {
            params.set("startDate", startDate)
        } else {
            params.delete("startDate")
        }

        if (endDate) {
            params.set("endDate", endDate)
        } else {
            params.delete("endDate")
        }

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-obsidian-600" />
                <h3 className="text-lg font-medium text-obsidian-900">Date Range</h3>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {DATE_PRESETS.map((preset) => {
                    const isActive =
                        preset.days === null
                            ? !searchParams.get("startDate") && !searchParams.get("endDate")
                            : false // We'll let custom dates show as no preset active

                    return (
                        <button
                            key={preset.label}
                            onClick={() => handlePresetClick(preset.days)}
                            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-obsidian-900 text-white"
                                    : "bg-obsidian-100 text-obsidian-700 hover:bg-obsidian-200"
                            }`}
                        >
                            {preset.label}
                        </button>
                    )
                })}
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-obsidian-700 mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-obsidian-700 mb-2">
                        End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleCustomDateChange}
                        className="w-full px-4 py-2 bg-obsidian-900 text-white rounded-sm hover:bg-obsidian-700 transition-colors font-medium"
                    >
                        Apply Custom Range
                    </button>
                </div>
            </div>
        </div>
    )
}
