"use client"

export interface HorizontalBarChartDataPoint {
    label: string
    value: number
    formattedValue?: string
}

export interface HorizontalBarChartProps {
    data: Array<HorizontalBarChartDataPoint>
    color?: string
    maxBars?: number
}

export function HorizontalBarChart({
    data,
    color = "bg-blue-500",
    maxBars = 10,
}: HorizontalBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No data available
            </div>
        )
    }

    const visibleData = data.slice(0, maxBars)
    const max = Math.max(...visibleData.map((d) => d.value), 1)

    return (
        <div className="space-y-3" role="img" aria-label="Horizontal bar chart">
            {visibleData.map((item) => {
                const widthPercent = (item.value / max) * 100
                const displayValue = item.formattedValue ?? String(item.value)

                return (
                    <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-obsidian-600 w-24 shrink-0 truncate text-right" title={item.label}>
                            {item.label}
                        </span>
                        <div className="flex-1 h-3 bg-obsidian-100 rounded-full overflow-hidden">
                            <div
                                className={`h-3 rounded-full ${color}`}
                                style={{ width: `${widthPercent}%` }}
                            />
                        </div>
                        <span className="text-xs text-obsidian-500 font-tabular w-16 shrink-0">
                            {displayValue}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
