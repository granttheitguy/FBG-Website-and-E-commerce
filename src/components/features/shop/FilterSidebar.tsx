"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronUp, X } from "lucide-react"

interface CategoryOption {
    id: string
    name: string
    slug: string
}

interface FilterSidebarProps {
    categories: CategoryOption[]
    mobileOpen: boolean
    setMobileOpen: (open: boolean) => void
}

export default function FilterSidebar({ categories, mobileOpen, setMobileOpen }: FilterSidebarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [priceOpen, setPriceOpen] = useState(true)
    const [categoryOpen, setCategoryOpen] = useState(true)
    const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "")
    const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "")

    const activeCategory = searchParams.get("category") ?? ""
    const activeQuery = searchParams.get("q") ?? ""
    const activePriceMin = searchParams.get("priceMin") ?? ""
    const activePriceMax = searchParams.get("priceMax") ?? ""

    // Count active filters
    const activeFilterCount = [
        activeCategory,
        activePriceMin,
        activePriceMax,
        activeQuery,
    ].filter(Boolean).length

    const updateFilters = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString())

            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "") {
                    params.delete(key)
                } else {
                    params.set(key, value)
                }
            })

            // Reset to page 1 when filters change
            params.delete("page")

            const queryString = params.toString()
            router.push(`/shop${queryString ? `?${queryString}` : ""}`)
        },
        [router, searchParams]
    )

    const handleCategoryChange = useCallback(
        (slug: string) => {
            const isCurrentlyActive = activeCategory === slug
            updateFilters({ category: isCurrentlyActive ? null : slug })
        },
        [activeCategory, updateFilters]
    )

    const handlePriceSubmit = useCallback(() => {
        const min = priceMin.trim()
        const max = priceMax.trim()

        // Validate: only update if values are valid numbers or empty
        const minNum = min ? Number(min) : null
        const maxNum = max ? Number(max) : null

        if (min && (isNaN(minNum!) || minNum! < 0)) return
        if (max && (isNaN(maxNum!) || maxNum! < 0)) return

        updateFilters({
            priceMin: min || null,
            priceMax: max || null,
        })
    }, [priceMin, priceMax, updateFilters])

    const handlePriceKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handlePriceSubmit()
        }
    }

    const handleClearAll = useCallback(() => {
        setPriceMin("")
        setPriceMax("")
        router.push("/shop")
    }, [router])

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-obsidian-950/50 z-40 lg:hidden transition-opacity ${
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar Content */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-xl transform transition-transform duration-300
                    lg:translate-x-0 lg:static lg:z-0 lg:w-64 lg:p-0 lg:shadow-none lg:bg-transparent
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                aria-label="Product filters"
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-8 lg:hidden">
                    <span className="text-lg font-medium text-obsidian-900">
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold bg-gold-500 text-white rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </span>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center -mr-3"
                        aria-label="Close filters"
                    >
                        <X className="w-5 h-5 text-obsidian-500" />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Active Filters / Clear All */}
                    {activeFilterCount > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-obsidian-500 uppercase tracking-[0.08em]">
                                    Active Filters ({activeFilterCount})
                                </span>
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs font-medium text-obsidian-600 hover:text-obsidian-900 underline underline-offset-2 transition-colors min-h-[44px] flex items-center"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {activeCategory && (
                                    <ActiveFilterPill
                                        label={categories.find(c => c.slug === activeCategory)?.name ?? activeCategory}
                                        onRemove={() => updateFilters({ category: null })}
                                    />
                                )}
                                {activePriceMin && (
                                    <ActiveFilterPill
                                        label={`Min: \u20A6${activePriceMin}`}
                                        onRemove={() => {
                                            setPriceMin("")
                                            updateFilters({ priceMin: null })
                                        }}
                                    />
                                )}
                                {activePriceMax && (
                                    <ActiveFilterPill
                                        label={`Max: \u20A6${activePriceMax}`}
                                        onRemove={() => {
                                            setPriceMax("")
                                            updateFilters({ priceMax: null })
                                        }}
                                    />
                                )}
                                {activeQuery && (
                                    <ActiveFilterPill
                                        label={`"${activeQuery}"`}
                                        onRemove={() => updateFilters({ q: null })}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Categories */}
                    <div>
                        <button
                            onClick={() => setCategoryOpen(!categoryOpen)}
                            className="flex items-center justify-between w-full text-sm font-medium text-obsidian-900 mb-4 min-h-[44px]"
                            aria-expanded={categoryOpen}
                        >
                            Category
                            {categoryOpen ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                        {categoryOpen && (
                            <div className="space-y-3" role="group" aria-label="Category filters">
                                {categories.map((category) => {
                                    const isActive = activeCategory === category.slug
                                    return (
                                        <label
                                            key={category.id}
                                            className="flex items-center gap-3 cursor-pointer group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={() => handleCategoryChange(category.slug)}
                                                className="w-4 h-4 rounded-sm border-obsidian-300 text-obsidian-900 focus:ring-gold-500 accent-obsidian-900"
                                                aria-label={`Filter by ${category.name}`}
                                            />
                                            <span
                                                className={`text-sm transition-colors ${
                                                    isActive
                                                        ? "text-obsidian-900 font-medium"
                                                        : "text-obsidian-600 group-hover:text-obsidian-900"
                                                }`}
                                            >
                                                {category.name}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Price Range */}
                    <div className="border-t border-obsidian-200 pt-8">
                        <button
                            onClick={() => setPriceOpen(!priceOpen)}
                            className="flex items-center justify-between w-full text-sm font-medium text-obsidian-900 mb-4 min-h-[44px]"
                            aria-expanded={priceOpen}
                        >
                            Price Range
                            {priceOpen ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                        {priceOpen && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-obsidian-500">
                                            &#8358;
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(e.target.value)}
                                            onBlur={handlePriceSubmit}
                                            onKeyDown={handlePriceKeyDown}
                                            min="0"
                                            className="w-full pl-6 pr-3 py-2.5 text-sm border border-obsidian-200 rounded-sm focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900"
                                            aria-label="Minimum price"
                                        />
                                    </div>
                                    <span className="text-obsidian-400" aria-hidden="true">
                                        -
                                    </span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-obsidian-500">
                                            &#8358;
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(e.target.value)}
                                            onBlur={handlePriceSubmit}
                                            onKeyDown={handlePriceKeyDown}
                                            min="0"
                                            className="w-full pl-6 pr-3 py-2.5 text-sm border border-obsidian-200 rounded-sm focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900"
                                            aria-label="Maximum price"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handlePriceSubmit}
                                    className="w-full py-2.5 text-sm font-medium text-obsidian-900 bg-obsidian-50 hover:bg-obsidian-100 rounded-sm transition-colors min-h-[44px]"
                                >
                                    Apply Price Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}

/* --- Active Filter Pill --- */

interface ActiveFilterPillProps {
    label: string
    onRemove: () => void
}

function ActiveFilterPill({ label, onRemove }: ActiveFilterPillProps) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gold-50 text-gold-600 border border-gold-200 rounded-sm">
            {label}
            <button
                onClick={onRemove}
                className="hover:text-gold-800 transition-colors p-0.5"
                aria-label={`Remove filter: ${label}`}
            >
                <X className="w-3 h-3" />
            </button>
        </span>
    )
}
