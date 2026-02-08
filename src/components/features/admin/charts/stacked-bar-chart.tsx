"use client"

export interface StackedBarSegment {
    label: string
    value: number
    color: string
}

export interface StackedBarChartDataPoint {
    date: string
    segments: Array<StackedBarSegment>
}

export interface StackedBarChartProps {
    data: Array<StackedBarChartDataPoint>
    height?: number
    formatValue?: (value: number) => string
}

const defaultFormat = (value: number) => {
    if (value >= 1000000) return `\u20A6${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `\u20A6${(value / 1000).toFixed(1)}K`
    return `\u20A6${value.toFixed(0)}`
}

export function StackedBarChart({
    data,
    height = 260,
    formatValue = defaultFormat,
}: StackedBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No data available
            </div>
        )
    }

    const width = 700
    const legendHeight = 30
    const padding = { top: 20, right: 20, bottom: 40, left: 70 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom - legendHeight

    // Compute max stacked total
    const totals = data.map((d) => d.segments.reduce((sum, s) => sum + s.value, 0))
    const max = Math.max(...totals, 1)

    // Collect unique segment labels (preserving order from first data point)
    const segmentLabelsMap = new Map<string, string>()
    for (const point of data) {
        for (const seg of point.segments) {
            if (!segmentLabelsMap.has(seg.label)) {
                segmentLabelsMap.set(seg.label, seg.color)
            }
        }
    }
    const uniqueSegments = Array.from(segmentLabelsMap.entries()).map(([label, color]) => ({
        label,
        color,
    }))

    const barGroupWidth = chartWidth / data.length
    const barGap = barGroupWidth * 0.2
    const barWidth = barGroupWidth - barGap

    const gridRatios = [0, 0.25, 0.5, 0.75, 1]

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height - legendHeight}`} className="w-full h-auto" role="img" aria-label="Stacked bar chart">
                    {/* Y-axis grid lines and labels */}
                    {gridRatios.map((ratio) => {
                        const y = padding.top + chartHeight * (1 - ratio)
                        return (
                            <g key={ratio}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="#D6D0C4"
                                    strokeWidth="1"
                                />
                                <text
                                    x={padding.left - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#7C7670"
                                >
                                    {formatValue(max * ratio)}
                                </text>
                            </g>
                        )
                    })}

                    {/* X-axis line */}
                    <line
                        x1={padding.left}
                        y1={padding.top + chartHeight}
                        x2={width - padding.right}
                        y2={padding.top + chartHeight}
                        stroke="#D6D0C4"
                        strokeWidth="1"
                    />

                    {/* Stacked bars */}
                    {data.map((point, index) => {
                        const groupX = padding.left + index * barGroupWidth + barGap / 2
                        let cumulativeHeight = 0

                        return (
                            <g key={point.date}>
                                {/* Stack segments bottom to top */}
                                {point.segments.map((segment) => {
                                    const segmentHeight = (segment.value / max) * chartHeight
                                    const y = padding.top + chartHeight - cumulativeHeight - segmentHeight
                                    cumulativeHeight += segmentHeight

                                    return (
                                        <rect
                                            key={segment.label}
                                            x={groupX}
                                            y={y}
                                            width={barWidth}
                                            height={segmentHeight}
                                            fill={segment.color}
                                            rx="2"
                                        />
                                    )
                                })}

                                {/* X-axis label */}
                                <text
                                    x={groupX + barWidth / 2}
                                    y={padding.top + chartHeight + 16}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#7C7670"
                                >
                                    {new Date(point.date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {uniqueSegments.map((segment) => (
                    <div key={segment.label} className="flex items-center gap-1.5 text-xs">
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: segment.color }}
                            aria-hidden="true"
                        />
                        <span className="text-obsidian-600">{segment.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
