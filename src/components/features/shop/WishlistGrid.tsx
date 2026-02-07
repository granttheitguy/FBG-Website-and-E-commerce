"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, ShoppingBag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useWishlist } from "@/context/WishlistContext"
import { useCart } from "@/context/CartContext"

interface WishlistProduct {
    id: string
    name: string
    slug: string
    basePrice: number
    status: string
    images: { imageUrl: string }[]
    variants: { id: string; size: string | null; stockQty: number; priceOverride: number | null }[]
}

interface WishlistItemData {
    id: string
    productId: string
    product: WishlistProduct
}

interface WishlistGridProps {
    items: WishlistItemData[]
}

export default function WishlistGrid({ items }: WishlistGridProps) {
    const { toggleWishlist } = useWishlist()
    const { addItem, setIsCartOpen } = useCart()
    const router = useRouter()
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
    const [showSizePickerFor, setShowSizePickerFor] = useState<string | null>(null)

    const handleRemove = async (productId: string) => {
        setRemovingIds((prev) => new Set(prev).add(productId))
        try {
            await toggleWishlist(productId)
            router.refresh()
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev)
                next.delete(productId)
                return next
            })
        }
    }

    const handleAddToCart = (product: WishlistProduct, variant: { id: string; size: string | null; stockQty: number }) => {
        if (variant.stockQty === 0) return

        addItem({
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            price: product.basePrice,
            image: product.images[0]?.imageUrl,
            quantity: 1,
            size: variant.size || "One Size",
            slug: product.slug,
        })
        setShowSizePickerFor(null)
        setIsCartOpen(true)
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
                const { product } = item
                const isRemoving = removingIds.has(product.id)
                const showingSizes = showSizePickerFor === product.id
                const hasMultipleVariants = product.variants.length > 1
                const hasStock = product.variants.some((v) => v.stockQty > 0)

                return (
                    <div
                        key={item.id}
                        className="bg-surface-elevated border border-obsidian-200 rounded-sm overflow-hidden shadow-sm group"
                    >
                        {/* Image */}
                        <div className="relative aspect-[3/4] bg-obsidian-100">
                            <Link href={`/product/${product.slug}`}>
                                {product.images[0] ? (
                                    <img
                                        src={product.images[0].imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-obsidian-400 text-sm">
                                        No Image
                                    </div>
                                )}
                            </Link>

                            {/* Remove button */}
                            <button
                                onClick={() => handleRemove(product.id)}
                                disabled={isRemoving}
                                aria-label={`Remove ${product.name} from wishlist`}
                                className="absolute top-3 right-3 min-w-[48px] min-h-[48px] bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-wait"
                            >
                                <X className="w-4 h-4 text-obsidian-600" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <Link href={`/product/${product.slug}`} className="block mb-3">
                                <h3 className="text-sm font-medium text-obsidian-900 hover:underline underline-offset-2 decoration-obsidian-300 transition-all line-clamp-2">
                                    {product.name}
                                </h3>
                                <p className="text-[15px] font-semibold text-obsidian-900 font-tabular tracking-[0.02em] mt-1">
                                    {formatCurrency(product.basePrice)}
                                </p>
                            </Link>

                            {/* Add to Cart / Size Picker */}
                            {!hasStock ? (
                                <p className="text-xs text-obsidian-400 text-center py-3">
                                    Out of stock
                                </p>
                            ) : showingSizes ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-obsidian-700">Select size:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => handleAddToCart(product, variant)}
                                                disabled={variant.stockQty === 0}
                                                className={`min-w-[36px] h-8 px-2 text-xs font-medium rounded-sm transition-colors
                                                    ${variant.stockQty === 0
                                                        ? "text-obsidian-300 line-through cursor-not-allowed bg-obsidian-50"
                                                        : "text-obsidian-900 bg-white hover:bg-obsidian-900 hover:text-white border border-obsidian-200"
                                                    }`}
                                            >
                                                {variant.size || "OS"}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowSizePickerFor(null)}
                                        className="text-xs text-obsidian-500 hover:text-obsidian-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (hasMultipleVariants) {
                                            setShowSizePickerFor(product.id)
                                        } else {
                                            const variant = product.variants.find((v) => v.stockQty > 0)
                                            if (variant) handleAddToCart(product, variant)
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-obsidian-900 text-white py-3 text-sm font-medium rounded-sm hover:bg-gold-500 transition-colors"
                                >
                                    <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                                    {hasMultipleVariants ? "Select Size" : "Add to Bag"}
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
