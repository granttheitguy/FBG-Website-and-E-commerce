"use client"

export interface BarChartDataPoint {
    label: string
    value: number
    previousValue?: number
}

export interface BarChartProps {
    data: Array<BarChartDataPoint>
    height?: number
    color?: string
    previousColor?: string
    formatValue?: (value: number) => string
    showComparison?: boolean
    orientation?: "vertical" | "horizontal"
}

const defaultFormat = (value: number) => {
    if (value >= 1000000) return `\u20A6${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `\u20A6${(value / 1000).toFixed(1)}K`
    return `\u20A6${value.toFixed(0)}`
}

function VerticalBarChart({
    data,
    height,
    color,
    previousColor,
    formatValue,
    showComparison,
}: Omit<Required<BarChartProps>, "orientation">) {
    const width = 600
    const padding = { top: 20, right: 20, bottom: 40, left: 70 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const allValues = [
        ...data.map((d) => d.value),
        ...(showComparison ? data.filter((d) => d.previousValue !== undefined).map((d) => d.previousValue as number) : []),
    ]
    const max = Math.max(...allValues, 1)

    const groupWidth = chartWidth / data.length
    const barGap = groupWidth * 0.2
    const barsInGroup = showComparison ? 2 : 1
    const barWidth = (groupWidth - barGap) / barsInGroup

    const gridRatios = [0, 0.25, 0.5, 0.75, 1]

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Bar chart">
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

            {/* Bars */}
            {data.map((item, index) => {
                const groupX = padding.left + index * groupWidth + barGap / 2
                const barHeight = (item.value / max) * chartHeight
                const barY = padding.top + chartHeight - barHeight

                return (
                    <g key={item.label}>
                        {/* Current value bar */}
                        <rect
                            x={groupX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            fill={color}
                            rx="2"
                        />

                        {/* Previous value bar (grouped) */}
                        {showComparison && item.previousValue !== undefined && (
                            <rect
                                x={groupX + barWidth}
                                y={padding.top + chartHeight - (item.previousValue / max) * chartHeight}
                                width={barWidth}
                                height={(item.previousValue / max) * chartHeight}
                                fill={previousColor}
                                rx="2"
                            />
                        )}

                        {/* X-axis label */}
                        <text
                            x={groupX + (showComparison ? barWidth : barWidth / 2)}
                            y={height - padding.bottom + 16}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#7C7670"
                        >
                            {item.label}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

function HorizontalBarChart({
    data,
    height,
    color,
    previousColor,
    formatValue,
    showComparison,
}: Omit<Required<BarChartProps>, "orientation">) {
    const width = 600
    const padding = { top: 20, right: 60, bottom: 20, left: 100 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const allValues = [
        ...data.map((d) => d.value),
        ...(showComparison ? data.filter((d) => d.previousValue !== undefined).map((d) => d.previousValue as number) : []),
    ]
    const max = Math.max(...allValues, 1)

    const groupHeight = chartHeight / data.length
    const barGap = groupHeight * 0.2
    const barsInGroup = showComparison ? 2 : 1
    const barHeight = (groupHeight - barGap) / barsInGroup

    const gridValues = [0, 0.25, 0.5, 0.75, 1]

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Horizontal bar chart">
            {/* X-axis grid lines and labels */}
            {gridValues.map((ratio) => {
                const x = padding.left + chartWidth * ratio
                return (
                    <g key={ratio}>
                        <line
                            x1={x}
                            y1={padding.top}
                            x2={x}
                            y2={padding.top + chartHeight}
                            stroke="#D6D0C4"
                            strokeWidth="1"
                        />
                        <text
                            x={x}
                            y={padding.top - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#7C7670"
                        >
                            {formatValue(max * ratio)}
                        </text>
                    </g>
                )
            })}

            {/* Y-axis line */}
            <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + chartHeight}
                stroke="#D6D0C4"
                strokeWidth="1"
            />

            {/* Bars */}
            {data.map((item, index) => {
                const groupY = padding.top + index * groupHeight + barGap / 2
                const barW = (item.value / max) * chartWidth

                return (
                    <g key={item.label}>
                        {/* Label on the left */}
                        <text
                            x={padding.left - 8}
                            y={groupY + (showComparison ? barHeight : barHeight / 2) + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#7C7670"
                        >
                            {item.label}
                        </text>

                        {/* Current value bar */}
                        <rect
                            x={padding.left}
                            y={groupY}
                            width={barW}
                            height={barHeight}
                            fill={color}
                            rx="2"
                        />

                        {/* Value label on the right */}
                        <text
                            x={padding.left + barW + 6}
                            y={groupY + barHeight / 2 + 4}
                            fontSize="10"
                            fill="#7C7670"
                        >
                            {formatValue(item.value)}
                        </text>

                        {/* Previous value bar */}
                        {showComparison && item.previousValue !== undefined && (
                            <>
                                <rect
                                    x={padding.left}
                                    y={groupY + barHeight}
                                    width={(item.previousValue / max) * chartWidth}
                                    height={barHeight}
                                    fill={previousColor}
                                    rx="2"
                                />
                                <text
                                    x={padding.left + (item.previousValue / max) * chartWidth + 6}
                                    y={groupY + barHeight + barHeight / 2 + 4}
                                    fontSize="10"
                                    fill="#7C7670"
                                >
                                    {formatValue(item.previousValue)}
                                </text>
                            </>
                        )}
                    </g>
                )
            })}
        </svg>
    )
}

export function BarChart({
    data,
    height = 240,
    color = "#3b82f6",
    previousColor = "#94a3b8",
    formatValue = defaultFormat,
    showComparison = false,
    orientation = "vertical",
}: BarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No data available
            </div>
        )
    }

    const resolvedProps = {
        data,
        height,
        color,
        previousColor,
        formatValue,
        showComparison,
    }

    return (
        <div className="w-full overflow-x-auto">
            {orientation === "horizontal" ? (
                <HorizontalBarChart {...resolvedProps} />
            ) : (
                <VerticalBarChart {...resolvedProps} />
            )}
        </div>
    )
}
