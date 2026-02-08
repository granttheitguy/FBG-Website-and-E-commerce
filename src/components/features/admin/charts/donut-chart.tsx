"use client"

export interface DonutChartSegment {
    label: string
    value: number
    color: string
}

export interface DonutChartProps {
    data: Array<DonutChartSegment>
    size?: number
    centerLabel?: string
    centerValue?: string
}

export function DonutChart({
    data,
    size = 200,
    centerLabel,
    centerValue,
}: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0)

    if (!data || data.length === 0 || total === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No data available
            </div>
        )
    }

    const cx = size / 2
    const cy = size / 2
    const strokeWidth = 32
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    // Build segments: each segment is a circle with dasharray offset
    let accumulatedOffset = 0
    const segments = data
        .filter((d) => d.value > 0)
        .map((segment) => {
            const segmentLength = (segment.value / total) * circumference
            const gapSize = 2
            const visibleLength = Math.max(segmentLength - gapSize, 0)
            const dashArray = `${visibleLength} ${circumference - visibleLength}`
            // Rotate to start from top (-90 degrees) and offset by accumulated amount
            const rotation = -90 + (accumulatedOffset / circumference) * 360
            accumulatedOffset += segmentLength

            return {
                ...segment,
                dashArray,
                rotation,
            }
        })

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Donut SVG */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                role="img"
                aria-label="Donut chart"
            >
                {/* Background ring */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke="#E8E3DA"
                    strokeWidth={strokeWidth}
                />

                {/* Segments */}
                {segments.map((segment) => (
                    <circle
                        key={segment.label}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={segment.dashArray}
                        strokeLinecap="butt"
                        transform={`rotate(${segment.rotation} ${cx} ${cy})`}
                    />
                ))}

                {/* Center text */}
                {centerValue && (
                    <text
                        x={cx}
                        y={centerLabel ? cy - 4 : cy + 5}
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="bold"
                        fill="#3D3831"
                    >
                        {centerValue}
                    </text>
                )}
                {centerLabel && (
                    <text
                        x={cx}
                        y={centerValue ? cy + 16 : cy + 5}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#7C7670"
                    >
                        {centerLabel}
                    </text>
                )}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {data.filter((d) => d.value > 0).map((segment) => {
                    const percentage = ((segment.value / total) * 100).toFixed(1)
                    return (
                        <div key={segment.label} className="flex items-center gap-1.5 text-xs">
                            <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: segment.color }}
                                aria-hidden="true"
                            />
                            <span className="text-obsidian-600">{segment.label}</span>
                            <span className="text-obsidian-400 font-tabular">
                                {segment.value} ({percentage}%)
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
