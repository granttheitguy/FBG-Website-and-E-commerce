"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import FilterSidebar from "./FilterSidebar"
import { SlidersHorizontal } from "lucide-react"

interface FilterSidebarWrapperProps {
    categories: { id: string; name: string; slug: string }[]
}

export default function FilterSidebarWrapper({ categories }: FilterSidebarWrapperProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const searchParams = useSearchParams()

    // Calculate active filter count for the mobile trigger badge
    const activeFilterCount = [
        searchParams.get("category"),
        searchParams.get("priceMin"),
        searchParams.get("priceMax"),
        searchParams.get("q"),
    ].filter(Boolean).length

    return (
        <>
            {/* Mobile Trigger Button */}
            <div className="lg:hidden mb-6">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-100 rounded-sm text-sm font-medium text-obsidian-900 w-full justify-center min-h-[48px] hover:bg-obsidian-200 transition-colors"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filter Products
                    {activeFilterCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold bg-gold-500 text-white rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            <FilterSidebar
                categories={categories}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />
        </>
    )
}
