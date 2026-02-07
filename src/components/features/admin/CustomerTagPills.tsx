"use client"

import type { CustomerTag } from "@/types/crm"

interface CustomerTagPillsProps {
    tags: CustomerTag[]
    onRemove?: (tagId: string) => void
    size?: "sm" | "md"
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    // Using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6 ? "#44403C" : "#FAFAF9"
}

export default function CustomerTagPills({ tags, onRemove, size = "sm" }: CustomerTagPillsProps) {
    if (tags.length === 0) {
        return null
    }

    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-2.5 py-1 text-xs"

    return (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Customer tags">
            {tags.map((tag) => (
                <span
                    key={tag.id}
                    role="listitem"
                    className={`inline-flex items-center gap-1 rounded-sm font-medium ${sizeClasses}`}
                    style={{
                        backgroundColor: hexToRgba(tag.color, 0.15),
                        color: getContrastColor(hexToRgba(tag.color, 0.15)) === "#FAFAF9"
                            ? tag.color
                            : getContrastColor("#FFFFFF") === "#FAFAF9"
                                ? tag.color
                                : tag.color,
                        borderWidth: 1,
                        borderColor: hexToRgba(tag.color, 0.3),
                    }}
                >
                    {tag.name}
                    {onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(tag.id)}
                            className="ml-0.5 -mr-0.5 p-0.5 rounded-sm hover:opacity-70 transition-opacity min-w-[20px] min-h-[20px] flex items-center justify-center"
                            aria-label={`Remove ${tag.name} tag`}
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
            ))}
        </div>
    )
}
