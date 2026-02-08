import { TrendingUp, TrendingDown, Minus } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendIndicatorProps {
  /** The percentage change to display (e.g. 12.5 for +12.5%) */
  changePercent?: number | null
  /**
   * When true (default), a positive change is rendered in green and negative
   * in red. Set to false for metrics where a decrease is desirable (e.g. refund
   * rate, churn).
   */
  positiveIsGood?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrendIndicator({
  changePercent,
  positiveIsGood = true,
}: TrendIndicatorProps) {
  if (changePercent === undefined || changePercent === null) {
    return null
  }

  const isZero = changePercent === 0
  const isPositive = changePercent > 0

  // Determine semantic color
  const isGood = isZero
    ? null
    : positiveIsGood
      ? isPositive
      : !isPositive

  const colorClass = isGood === null
    ? "text-obsidian-500"
    : isGood
      ? "text-green-600"
      : "text-red-600"

  // Format the display string
  const formatted = isZero
    ? "0%"
    : `${isPositive ? "+" : ""}${changePercent.toFixed(1)}%`

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass}`}>
      {isZero ? (
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      ) : isPositive ? (
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span className="text-xs font-medium">{formatted}</span>
    </span>
  )
}
