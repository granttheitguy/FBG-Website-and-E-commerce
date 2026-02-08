"use client"

import { useState, useCallback } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { Download } from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive the current tab slug from the pathname.
 * e.g. "/admin/accounting/revenue" -> "revenue"
 */
function getTabFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  return segments[segments.length - 1] ?? "overview"
}

/**
 * Compute ISO date strings for the selected preset relative to "now".
 */
function getDateRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString().split("T")[0]

  let start: Date

  switch (preset) {
    case "7d":
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      break
    case "30d":
      start = new Date(now)
      start.setDate(start.getDate() - 30)
      break
    case "90d":
      start = new Date(now)
      start.setDate(start.getDate() - 90)
      break
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1)
      break
    case "1y":
      start = new Date(now)
      start.setFullYear(start.getFullYear() - 1)
      break
    case "all":
    default:
      start = new Date("2020-01-01")
      break
  }

  const startDate = start.toISOString().split("T")[0]
  return { startDate, endDate }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExportMenu() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)

    try {
      const preset = searchParams.get("preset") ?? "30d"
      const tab = getTabFromPathname(pathname)
      const { startDate, endDate } = getDateRange(preset)

      const params = new URLSearchParams({
        tab,
        startDate,
        endDate,
      })

      const response = await fetch(
        `/api/admin/accounting/export?${params.toString()}`,
      )

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")

      anchor.href = url
      anchor.download = `accounting-${tab}-${startDate}-to-${endDate}.csv`
      document.body.appendChild(anchor)
      anchor.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(anchor)
    } catch (error) {
      // In production, surface this through a toast or notification system.
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }, [searchParams, pathname])

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex min-h-[48px] items-center gap-2 rounded-sm bg-obsidian-100 px-3 py-2 text-sm text-obsidian-700 transition-colors hover:bg-obsidian-200 disabled:opacity-50 disabled:pointer-events-none sm:min-h-0"
      aria-label="Export accounting data to CSV"
    >
      {isExporting ? (
        <svg
          className="h-4 w-4 animate-spin text-obsidian-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isExporting ? "Exporting..." : "Export"}</span>
    </button>
  )
}
