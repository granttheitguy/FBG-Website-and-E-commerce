import { BarChart3 } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyAccountingStateProps {
  /** Heading displayed below the icon */
  title?: string
  /** Supporting copy beneath the heading */
  description?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TITLE = "No data available"
const DEFAULT_DESCRIPTION =
  "There is no data for the selected period. Try adjusting your date range."

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyAccountingState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: EmptyAccountingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <BarChart3
        className="h-12 w-12 text-obsidian-300"
        aria-hidden="true"
      />
      <h3 className="mt-4 text-lg font-medium text-obsidian-700">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-center text-sm text-obsidian-500">
        {description}
      </p>
    </div>
  )
}
