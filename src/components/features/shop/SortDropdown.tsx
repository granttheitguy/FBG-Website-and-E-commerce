"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useCallback } from "react"

const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]["value"]

interface SortDropdownProps {
    currentSort: string
}

export default function SortDropdown({ currentSort }: SortDropdownProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const activeSort = (SORT_OPTIONS.find(opt => opt.value === currentSort) ?? SORT_OPTIONS[0])

    const handleSort = useCallback((value: SortValue) => {
        const params = new URLSearchParams(searchParams.toString())

        if (value === "newest") {
            params.delete("sort")
        } else {
            params.set("sort", value)
        }

        // Reset to page 1 when sorting changes
        params.delete("page")

        const queryString = params.toString()
        router.push(`/shop${queryString ? `?${queryString}` : ""}`)
    }, [router, searchParams])

    return (
        <div className="relative group">
            <button
                className="flex items-center gap-2 text-sm font-medium text-obsidian-700 hover:text-obsidian-900 py-2 min-h-[44px]"
                aria-haspopup="listbox"
                aria-label={`Sort by: ${activeSort.label}`}
            >
                <span className="hidden sm:inline">Sort by:</span>{" "}
                <span className="text-obsidian-900">{activeSort.label}</span>
                <ChevronDown className="w-4 h-4" />
            </button>
            <div
                className="absolute right-0 top-full mt-1 w-52 bg-white border border-obsidian-100 rounded-sm shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30"
                role="listbox"
                aria-label="Sort options"
            >
                <div className="py-1">
                    {SORT_OPTIONS.map((option) => {
                        const isActive = option.value === activeSort.value
                        return (
                            <button
                                key={option.value}
                                onClick={() => handleSort(option.value)}
                                role="option"
                                aria-selected={isActive}
                                className={`block w-full text-left px-4 py-2.5 text-sm transition-colors min-h-[44px] ${
                                    isActive
                                        ? "text-obsidian-900 bg-obsidian-50 font-medium border-l-2 border-gold-500"
                                        : "text-obsidian-600 hover:bg-obsidian-50 hover:text-obsidian-900"
                                }`}
                            >
                                {option.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
