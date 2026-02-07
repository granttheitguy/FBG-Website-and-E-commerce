"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react"

interface WishlistContextType {
    /** Check whether a given product is in the user's wishlist */
    isWishlisted: (productId: string) => boolean
    /** Add or remove a product from the wishlist. Returns false if user is not logged in. */
    toggleWishlist: (productId: string) => Promise<boolean>
    /** Total number of wishlisted items */
    wishlistCount: number
    /** Whether the initial fetch is still in progress */
    isLoading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Fetch wishlist from API on mount. If the user is not authenticated,
    // the API returns 401 and we simply leave the set empty.
    useEffect(() => {
        const controller = new AbortController()
        let cancelled = false

        async function fetchWishlist() {
            setIsLoading(true)
            try {
                const res = await fetch("/api/wishlist", {
                    signal: controller.signal,
                })

                if (res.status === 401) {
                    // User is not logged in -- this is expected
                    setIsAuthenticated(false)
                    return
                }

                if (!res.ok) throw new Error("Failed to fetch wishlist")

                setIsAuthenticated(true)
                const data = await res.json()
                if (!cancelled) {
                    const ids = new Set<string>(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data.items.map((item: any) => item.productId)
                    )
                    setWishlistedIds(ids)
                }
            } catch (err) {
                if (!cancelled && (err as Error).name !== "AbortError") {
                    console.error("Failed to fetch wishlist:", err)
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        fetchWishlist()

        return () => {
            cancelled = true
            controller.abort()
        }
    }, [])

    const isWishlisted = useCallback(
        (productId: string) => wishlistedIds.has(productId),
        [wishlistedIds]
    )

    const toggleWishlist = useCallback(
        async (productId: string): Promise<boolean> => {
            // Return false if user is not logged in -- caller should redirect
            if (!isAuthenticated) {
                return false
            }

            const wasWishlisted = wishlistedIds.has(productId)

            // Optimistic update
            setWishlistedIds((prev) => {
                const next = new Set(prev)
                if (wasWishlisted) {
                    next.delete(productId)
                } else {
                    next.add(productId)
                }
                return next
            })

            try {
                if (wasWishlisted) {
                    const res = await fetch(`/api/wishlist/${productId}`, {
                        method: "DELETE",
                    })
                    if (!res.ok) throw new Error("Failed to remove from wishlist")
                } else {
                    const res = await fetch("/api/wishlist", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId }),
                    })
                    if (!res.ok) throw new Error("Failed to add to wishlist")
                }
                return true
            } catch (err) {
                console.error("Wishlist toggle failed:", err)
                // Rollback optimistic update
                setWishlistedIds((prev) => {
                    const next = new Set(prev)
                    if (wasWishlisted) {
                        next.add(productId)
                    } else {
                        next.delete(productId)
                    }
                    return next
                })
                return true // Still logged in, just failed
            }
        },
        [wishlistedIds, isAuthenticated]
    )

    return (
        <WishlistContext.Provider
            value={{
                isWishlisted,
                toggleWishlist,
                wishlistCount: wishlistedIds.size,
                isLoading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider")
    }
    return context
}
