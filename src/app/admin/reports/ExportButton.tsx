"use client"

import { Download } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export function ExportButton() {
    const searchParams = useSearchParams()
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const params = new URLSearchParams()
            const startDate = searchParams.get("startDate")
            const endDate = searchParams.get("endDate")

            if (startDate) params.set("startDate", startDate)
            if (endDate) params.set("endDate", endDate)

            const response = await fetch(`/api/admin/reports/export?${params.toString()}`)

            if (!response.ok) {
                throw new Error("Export failed")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `orders-report-${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Export error:", error)
            alert("Failed to export report. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export to CSV"}
        </button>
    )
}
