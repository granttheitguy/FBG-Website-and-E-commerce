"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchResult {
    id: string
    name: string
    slug: string
    basePrice: number
    images: { imageUrl: string }[]
}

interface SearchResponse {
    products: SearchResult[]
    total: number
}

interface SearchOverlayProps {
    onClose: () => void
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const router = useRouter()

    const debouncedQuery = useDebounce(query.trim(), 300)

    const fetchResults = useCallback(async (searchQuery: string) => {
        if (!searchQuery) {
            setResults([])
            setTotal(0)
            setHasSearched(false)
            return
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/search?q=${encodeURIComponent(searchQuery)}&limit=6`,
                { signal: controller.signal }
            )

            if (!response.ok) {
                throw new Error("Search failed")
            }

            const data: SearchResponse = await response.json()
            setResults(data.products)
            setTotal(data.total)
            setHasSearched(true)
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return // Silently ignore aborted requests
            }
            console.error("[SearchOverlay] Fetch error:", error)
            setResults([])
            setTotal(0)
            setHasSearched(true)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchResults(debouncedQuery)
    }, [debouncedQuery, fetchResults])

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // Focus the input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            onClose()
        }
        if (e.key === "Enter" && query.trim()) {
            onClose()
            router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
        }
    }

    const handleResultClick = () => {
        onClose()
    }

    return (
        <div className="absolute inset-x-0 top-full bg-white border-b border-obsidian-200 animate-fade-in-down shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 text-obsidian-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search products, collections, fabrics..."
                        autoFocus
                        className="w-full pl-8 pr-8 py-3 text-base border-none border-b border-obsidian-900 bg-transparent focus:outline-none focus:ring-0 placeholder:text-obsidian-400"
                        aria-label="Search products"
                        role="combobox"
                        aria-expanded={results.length > 0}
                        aria-haspopup="listbox"
                    />
                    <button
                        onClick={onClose}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Close search"
                    >
                        <X className="w-5 h-5 text-obsidian-500" />
                    </button>
                </div>

                {/* Results dropdown */}
                {(isLoading || hasSearched) && query.trim() && (
                    <div className="mt-4 border-t border-obsidian-100 pt-4" role="listbox" aria-label="Search results">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-obsidian-400" />
                                <span className="ml-2 text-sm text-obsidian-500">Searching...</span>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-obsidian-500">
                                    No results found for &ldquo;{query.trim()}&rdquo;
                                </p>
                                <p className="text-xs text-obsidian-400 mt-1">
                                    Try a different search term or browse our collections.
                                </p>
                            </div>
                        ) : (
                            <>
                                <ul className="space-y-1">
                                    {results.map((product) => (
                                        <li key={product.id} role="option">
                                            <Link
                                                href={`/product/${product.slug}`}
                                                onClick={handleResultClick}
                                                className="flex items-center gap-4 p-3 rounded-sm hover:bg-obsidian-50 transition-colors group"
                                            >
                                                <div className="w-12 h-14 bg-obsidian-100 rounded-sm overflow-hidden flex-shrink-0">
                                                    {product.images[0] ? (
                                                        <img
                                                            src={product.images[0].imageUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-obsidian-200" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-obsidian-900 truncate group-hover:underline underline-offset-2">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm text-obsidian-600 font-tabular mt-0.5">
                                                        {formatCurrency(product.basePrice)}
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                {total > results.length && (
                                    <div className="mt-4 pt-3 border-t border-obsidian-100 text-center">
                                        <Link
                                            href={`/shop?q=${encodeURIComponent(query.trim())}`}
                                            onClick={handleResultClick}
                                            className="inline-block text-sm font-medium text-obsidian-900 hover:text-gold-600 transition-colors underline underline-offset-4 decoration-obsidian-300 hover:decoration-gold-500 py-2 min-h-[44px]"
                                        >
                                            View all {total} results
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
