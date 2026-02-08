// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressBarProps {
  /** Current value */
  value: number
  /** Maximum value (used to calculate fill percentage) */
  max: number
  /** Optional label rendered above the bar on the left */
  label?: string
  /** Tailwind background-color class for the fill (default: "bg-blue-500") */
  color?: string
  /** Show computed percentage to the right of the label */
  showPercent?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  max,
  label,
  color = "bg-blue-500",
  showPercent = false,
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max
  const clampedValue = Math.max(0, Math.min(value, safeMax))
  const percent = Math.round((clampedValue / safeMax) * 100)

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-obsidian-700">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-xs font-medium text-obsidian-500 font-tabular">
              {percent}%
            </span>
          )}
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-obsidian-100"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label ?? `${percent}% progress`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
