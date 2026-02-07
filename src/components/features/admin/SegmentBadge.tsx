"use client"

import type { CustomerSegment } from "@/types/crm"

interface SegmentBadgeProps {
    segment: CustomerSegment
    onRemove?: (segmentId: string) => void
    size?: "sm" | "md"
}

export default function SegmentBadge({ segment, onRemove, size = "sm" }: SegmentBadgeProps) {
    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-2.5 py-1 text-xs"

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-sm border border-obsidian-200 bg-obsidian-50 text-obsidian-700 font-medium ${sizeClasses}`}
        >
            <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
                aria-hidden="true"
            />
            {segment.name}
            {onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(segment.id)}
                    className="ml-0.5 -mr-0.5 p-0.5 rounded-sm hover:bg-obsidian-200 transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                    aria-label={`Remove ${segment.name} segment`}
                >
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </span>
    )
}
