"use client"

import { useTransition } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportSubscribersCsv } from "./actions"

export function ExportCsvButton() {
    const [isPending, startTransition] = useTransition()

    function handleExport() {
        startTransition(async () => {
            const result = await exportSubscribersCsv()

            if (result.error) {
                alert(result.error)
                return
            }

            if (!result.csv) {
                alert("No data to export")
                return
            }

            const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        })
    }

    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={isPending}
        >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
        </Button>
    )
}
