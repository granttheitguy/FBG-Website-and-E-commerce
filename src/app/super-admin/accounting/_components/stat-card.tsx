import React from "react"
import { TrendIndicator } from "./trend-indicator"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatCardProps {
  /** Short descriptor shown above the value (e.g. "Total Revenue") */
  label: string
  /** Formatted display value (e.g. "NGN 12,450,000") */
  value: string
  /** Formatted value for the previous period, shown as comparison text */
  previousValue?: string
  /** Percentage change between periods */
  changePercent?: number
  /** Icon rendered in the top-right badge */
  icon: React.ReactNode
  /**
   * When true (default), a positive changePercent is treated as good (green).
   * Set false for metrics where going up is bad (e.g. refund rate).
   */
  positiveIsGood?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  previousValue,
  changePercent,
  icon,
  positiveIsGood = true,
}: StatCardProps) {
  return (
    <div className="rounded-sm border border-obsidian-200 bg-white p-5 shadow-sm">
      {/* Top row — label + icon */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-obsidian-500">
          {label}
        </span>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      {/* Value */}
      <p className="mt-3 text-2xl font-bold text-obsidian-900 font-tabular">
        {value}
      </p>

      {/* Trend + comparison */}
      <div className="mt-2 flex items-center gap-2">
        <TrendIndicator
          changePercent={changePercent}
          positiveIsGood={positiveIsGood}
        />
        {previousValue && (
          <span className="text-xs text-obsidian-400">
            vs {previousValue}
          </span>
        )}
      </div>
    </div>
  )
}
