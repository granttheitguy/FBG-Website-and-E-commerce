"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { useWishlist } from "@/context/WishlistContext"
import { cn } from "@/lib/utils"

export interface WishlistButtonProps {
    productId: string
    className?: string
}

export default function WishlistButton({ productId, className }: WishlistButtonProps) {
    const { isWishlisted, toggleWishlist } = useWishlist()
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const wishlisted = isWishlisted(productId)

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()

        if (isPending) return

        setIsPending(true)
        try {
            const isLoggedIn = await toggleWishlist(productId)
            if (!isLoggedIn) {
                router.push("/login")
            }
        } finally {
            setIsPending(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className={cn(
                "min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
                "disabled:cursor-wait",
                className
            )}
        >
            {isPending ? (
                <Loader2
                    className="w-5 h-5 text-obsidian-400 animate-spin"
                    aria-hidden="true"
                />
            ) : (
                <Heart
                    className={cn(
                        "w-5 h-5 transition-colors",
                        wishlisted
                            ? "text-red-500 fill-red-500"
                            : "text-obsidian-600"
                    )}
                    aria-hidden="true"
                />
            )}
        </button>
    )
}
