"use client"

interface RevenueChartProps {
    data: Array<{ date: string; value: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No revenue data available
            </div>
        )
    }

    const max = Math.max(...data.map(d => d.value), 1)
    const width = 800
    const height = 200
    const padding = { top: 20, right: 20, bottom: 30, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const points = data.map((item, index) => {
        const x = padding.left + (index / (data.length - 1)) * chartWidth
        const y = padding.top + chartHeight - (item.value / max) * chartHeight
        return `${x},${y}`
    }).join(' ')

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `₦${(value / 1000).toFixed(1)}K`
        return `₦${value.toFixed(0)}`
    }

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                    <g key={ratio}>
                        <line
                            x1={padding.left}
                            y1={padding.top + chartHeight * (1 - ratio)}
                            x2={width - padding.right}
                            y2={padding.top + chartHeight * (1 - ratio)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                        <text
                            x={padding.left - 10}
                            y={padding.top + chartHeight * (1 - ratio) + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            {formatCurrency(max * ratio)}
                        </text>
                    </g>
                ))}

                {/* X-axis */}
                <line
                    x1={padding.left}
                    y1={height - padding.bottom}
                    x2={width - padding.right}
                    y2={height - padding.bottom}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                />

                {/* Date labels (show every 7th day) */}
                {data.filter((_, i) => i % 7 === 0).map((item, index) => {
                    const actualIndex = index * 7
                    const x = padding.left + (actualIndex / (data.length - 1)) * chartWidth
                    return (
                        <text
                            key={item.date}
                            x={x}
                            y={height - padding.bottom + 15}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </text>
                    )
                })}

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                />

                {/* Area fill */}
                <polygon
                    points={`${padding.left},${height - padding.bottom} ${points} ${width - padding.right},${height - padding.bottom}`}
                    fill="#3b82f6"
                    fillOpacity="0.1"
                />

                {/* Data points */}
                {data.map((item, index) => {
                    const x = padding.left + (index / (data.length - 1)) * chartWidth
                    const y = padding.top + chartHeight - (item.value / max) * chartHeight
                    return (
                        <circle
                            key={item.date}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#3b82f6"
                        />
                    )
                })}
            </svg>
        </div>
    )
}
