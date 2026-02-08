"use client"

export interface AreaChartDataPoint {
    date: string
    value: number
    previousValue?: number
}

export interface AreaChartProps {
    data: Array<AreaChartDataPoint>
    height?: number
    color?: string
    previousColor?: string
    formatValue?: (value: number) => string
    showComparison?: boolean
}

const defaultFormat = (value: number) => {
    if (value >= 1000000) return `\u20A6${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `\u20A6${(value / 1000).toFixed(1)}K`
    return `\u20A6${value.toFixed(0)}`
}

function computeLabelInterval(dataLength: number): number {
    if (dataLength <= 7) return 1
    if (dataLength <= 14) return 2
    if (dataLength <= 31) return 7
    if (dataLength <= 90) return 14
    return 30
}

export function AreaChart({
    data,
    height = 240,
    color = "#3b82f6",
    previousColor = "#94a3b8",
    formatValue = defaultFormat,
    showComparison = false,
}: AreaChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No data available
            </div>
        )
    }

    const width = 800
    const padding = { top: 20, right: 20, bottom: 40, left: 70 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const allValues = [
        ...data.map((d) => d.value),
        ...(showComparison ? data.filter((d) => d.previousValue !== undefined).map((d) => d.previousValue as number) : []),
    ]
    const max = Math.max(...allValues, 1)

    const getX = (index: number): number => {
        if (data.length === 1) return padding.left + chartWidth / 2
        return padding.left + (index / (data.length - 1)) * chartWidth
    }

    const getY = (value: number): number => {
        return padding.top + chartHeight - (value / max) * chartHeight
    }

    const primaryPoints = data.map((item, index) => {
        return `${getX(index)},${getY(item.value)}`
    }).join(" ")

    const previousPoints = showComparison
        ? data
            .filter((d) => d.previousValue !== undefined)
            .map((item, index) => {
                const originalIndex = data.indexOf(item)
                return `${getX(originalIndex)},${getY(item.previousValue as number)}`
            })
            .join(" ")
        : ""

    const areaPoints = `${getX(0)},${padding.top + chartHeight} ${primaryPoints} ${getX(data.length - 1)},${padding.top + chartHeight}`

    const gridRatios = [0, 0.25, 0.5, 0.75, 1]
    const labelInterval = computeLabelInterval(data.length)

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Area chart">
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

                {/* X-axis date labels */}
                {data.map((item, index) => {
                    if (index % labelInterval !== 0) return null
                    const x = getX(index)
                    return (
                        <text
                            key={item.date}
                            x={x}
                            y={height - padding.bottom + 20}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#7C7670"
                        >
                            {new Date(item.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </text>
                    )
                })}

                {/* Primary area fill */}
                <polygon
                    points={areaPoints}
                    fill={color}
                    fillOpacity="0.1"
                />

                {/* Comparison dashed line */}
                {showComparison && previousPoints && (
                    <polyline
                        points={previousPoints}
                        fill="none"
                        stroke={previousColor}
                        strokeWidth="2"
                        strokeDasharray="6,4"
                    />
                )}

                {/* Primary line */}
                <polyline
                    points={primaryPoints}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                />

                {/* Data point circles on primary line */}
                {data.map((item, index) => (
                    <circle
                        key={item.date}
                        cx={getX(index)}
                        cy={getY(item.value)}
                        r="3"
                        fill={color}
                    />
                ))}
            </svg>
        </div>
    )
}
