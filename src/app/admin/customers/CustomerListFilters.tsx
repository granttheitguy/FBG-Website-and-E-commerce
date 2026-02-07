"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback } from "react"
import { Search } from "lucide-react"

interface FilterOption {
    id: string
    name: string
}

interface CustomerListFiltersProps {
    segments: FilterOption[]
    tags: FilterOption[]
    currentSearch: string
    currentSegment: string
    currentTag: string
}

export default function CustomerListFilters({
    segments,
    tags,
    currentSearch,
    currentSegment,
    currentTag,
}: CustomerListFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(currentSearch)

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const sp = new URLSearchParams(searchParams.toString())
            // Reset page to 1 on filter change
            sp.delete("page")
            for (const [key, val] of Object.entries(updates)) {
                if (val) {
                    sp.set(key, val)
                } else {
                    sp.delete(key)
                }
            }
            router.push(`/admin/customers?${sp.toString()}`)
        },
        [router, searchParams]
    )

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateParams({ search })
    }

    return (
        <div className="bg-white p-4 rounded-sm border border-obsidian-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" aria-hidden="true" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-obsidian-200 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 focus:outline-none transition-colors"
                    aria-label="Search customers"
                />
            </form>

            <select
                value={currentSegment}
                onChange={(e) => updateParams({ segment: e.target.value })}
                className="rounded-sm border border-obsidian-200 text-sm text-obsidian-900 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 focus:outline-none px-3 py-2.5 bg-white transition-colors min-w-[160px]"
                aria-label="Filter by segment"
            >
                <option value="">All Segments</option>
                {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                        {seg.name}
                    </option>
                ))}
            </select>

            <select
                value={currentTag}
                onChange={(e) => updateParams({ tag: e.target.value })}
                className="rounded-sm border border-obsidian-200 text-sm text-obsidian-900 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 focus:outline-none px-3 py-2.5 bg-white transition-colors min-w-[140px]"
                aria-label="Filter by tag"
            >
                <option value="">All Tags</option>
                {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                        {tag.name}
                    </option>
                ))}
            </select>
        </div>
    )
}
