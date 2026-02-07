"use client"

interface UserGrowthChartProps {
    data: Array<{ date: string; value: number }>
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-obsidian-400">
                No user data available
            </div>
        )
    }

    const max = Math.max(...data.map(d => d.value), 1)
    const width = 400
    const height = 200
    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const barWidth = chartWidth / data.length - 2

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-axis labels */}
                {[0, Math.ceil(max / 2), max].map((value, index) => (
                    <g key={index}>
                        <line
                            x1={padding.left}
                            y1={padding.top + (chartHeight * (max - value)) / max}
                            x2={width - padding.right}
                            y2={padding.top + (chartHeight * (max - value)) / max}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                        <text
                            x={padding.left - 10}
                            y={padding.top + (chartHeight * (max - value)) / max + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            {value}
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

                {/* Bars */}
                {data.map((item, index) => {
                    const x = padding.left + (index * chartWidth) / data.length + 1
                    const barHeight = (item.value / max) * chartHeight
                    const y = height - padding.bottom - barHeight
                    return (
                        <rect
                            key={item.date}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill="#10b981"
                            rx="2"
                        />
                    )
                })}

                {/* Date labels (show every 7th day) */}
                {data.filter((_, i) => i % 7 === 0).map((item, index) => {
                    const actualIndex = index * 7
                    const x = padding.left + (actualIndex * chartWidth) / data.length + barWidth / 2
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
            </svg>
        </div>
    )
}
