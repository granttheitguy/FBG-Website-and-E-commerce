"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Calendar } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Preset {
  label: string
  value: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESETS: Preset[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "YTD", value: "ytd" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
]

const DEFAULT_PRESET = "30d"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DateRangePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const activePreset = searchParams.get("preset") ?? DEFAULT_PRESET
  const isComparing = searchParams.get("compare") === "true"

  /**
   * Build a new URL preserving all existing search params, then navigate.
   */
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, val] of Object.entries(updates)) {
        if (val === null) {
          params.delete(key)
        } else {
          params.set(key, val)
        }
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const handlePresetClick = (value: string) => {
    updateParams({ preset: value })
  }

  const handleCompareToggle = () => {
    updateParams({ compare: isComparing ? null : "true" })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Calendar icon */}
      <Calendar
        className="hidden h-4 w-4 text-obsidian-400 sm:block"
        aria-hidden="true"
      />

      {/* Preset buttons */}
      <div className="flex flex-row items-center gap-1.5" role="group" aria-label="Date range presets">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.value

          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              className={`
                inline-flex min-h-[48px] min-w-[48px] items-center justify-center
                rounded-sm px-3 py-2 text-xs font-medium transition-colors
                sm:min-h-0 sm:min-w-0
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-obsidian-100 text-obsidian-700 hover:bg-obsidian-200"
                }
              `}
              aria-pressed={isActive}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* Comparison toggle */}
      <label className="flex min-h-[48px] cursor-pointer items-center gap-2 sm:min-h-0">
        <input
          type="checkbox"
          checked={isComparing}
          onChange={handleCompareToggle}
          className="h-4 w-4 rounded-sm border-obsidian-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="whitespace-nowrap text-xs text-obsidian-600">
          Compare to previous period
        </span>
      </label>
    </div>
  )
}
