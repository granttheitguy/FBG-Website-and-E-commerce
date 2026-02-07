"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

interface PaginationProps {
    currentPage: number
    totalPages: number
}

/**
 * Generates an array of page numbers to display with ellipsis markers.
 * Shows first, last, current, and nearby pages.
 * -1 represents an ellipsis.
 */
function getPageNumbers(current: number, total: number): number[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages: number[] = []

    // Always show first page
    pages.push(1)

    if (current > 3) {
        pages.push(-1) // ellipsis
    }

    // Pages around the current page
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    if (current < total - 2) {
        pages.push(-1) // ellipsis
    }

    // Always show last page
    if (total > 1) {
        pages.push(total)
    }

    return pages
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const navigateToPage = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams.toString())

        if (page <= 1) {
            params.delete("page")
        } else {
            params.set("page", String(page))
        }

        const queryString = params.toString()
        router.push(`/shop${queryString ? `?${queryString}` : ""}`)
    }, [router, searchParams])

    const pageNumbers = useMemo(
        () => getPageNumbers(currentPage, totalPages),
        [currentPage, totalPages]
    )

    if (totalPages <= 1) return null

    return (
        <div className="mt-16 flex justify-center">
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Pagination">
                <button
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 sm:px-4 py-2 text-sm text-obsidian-600 hover:text-obsidian-900 disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] transition-colors"
                    aria-label="Previous page"
                >
                    Previous
                </button>

                {pageNumbers.map((page, index) =>
                    page === -1 ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="text-obsidian-400 px-1 sm:px-2 select-none"
                            aria-hidden="true"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => navigateToPage(page)}
                            aria-label={`Page ${page}`}
                            aria-current={page === currentPage ? "page" : undefined}
                            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                                page === currentPage
                                    ? "bg-obsidian-900 text-white"
                                    : "text-obsidian-600 hover:bg-obsidian-100"
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 sm:px-4 py-2 text-sm text-obsidian-600 hover:text-obsidian-900 disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] transition-colors"
                    aria-label="Next page"
                >
                    Next
                </button>
            </nav>
        </div>
    )
}
