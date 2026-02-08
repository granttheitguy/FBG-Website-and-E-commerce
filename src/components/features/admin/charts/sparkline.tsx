"use client"

export interface SparklineProps {
    data: number[]
    width?: number
    height?: number
    color?: string
}

export function Sparkline({
    data,
    width = 80,
    height = 24,
    color = "#3b82f6",
}: SparklineProps) {
    if (!data || data.length < 2) {
        return null
    }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const verticalPadding = 2

    const chartHeight = height - verticalPadding * 2

    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1)) * width
            const y = verticalPadding + chartHeight - ((value - min) / range) * chartHeight
            return `${x},${y}`
        })
        .join(" ")

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="inline-block"
            role="img"
            aria-label="Sparkline trend"
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
