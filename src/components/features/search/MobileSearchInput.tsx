"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface MobileSearchInputProps {
    onNavigate: () => void
}

export default function MobileSearchInput({ onNavigate }: MobileSearchInputProps) {
    const [query, setQuery] = useState("")
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = query.trim()
        if (!trimmed) return

        onNavigate()
        router.push(`/shop?q=${encodeURIComponent(trimmed)}`)
    }

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400" />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shop..."
                className="w-full pl-10 pr-4 py-3 bg-obsidian-50 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-obsidian-300"
                aria-label="Search products"
            />
        </form>
    )
}
