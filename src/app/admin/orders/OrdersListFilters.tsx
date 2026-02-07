"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback } from "react"
import { Search } from "lucide-react"

interface OrdersListFiltersProps {
    currentSearch: string
    currentStatus: string
}

export default function OrdersListFilters({ currentSearch, currentStatus }: OrdersListFiltersProps) {
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
            router.push(`/admin/orders?${sp.toString()}`)
        },
        [router, searchParams]
    )

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateParams({ q: search })
    }

    return (
        <div className="bg-white p-4 rounded-sm border border-obsidian-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" aria-hidden="true" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by order number or customer email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-obsidian-200 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 focus:outline-none transition-colors"
                    aria-label="Search orders"
                />
            </form>

            <select
                value={currentStatus}
                onChange={(e) => updateParams({ status: e.target.value })}
                className="rounded-sm border border-obsidian-200 text-sm text-obsidian-900 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 focus:outline-none px-4 py-2.5 bg-white transition-colors min-w-[160px]"
                aria-label="Filter by status"
            >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
            </select>
        </div>
    )
}
