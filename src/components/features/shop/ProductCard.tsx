"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import { useState } from "react"
import WishlistButton from "@/components/features/shop/WishlistButton"

interface ProductCardProps {
    product: {
        id: string
        name: string
        slug: string
        basePrice: number
        descriptionShort: string | null
        images: { imageUrl: string }[]
        variants: { id: string; size: string | null; stockQty: number }[]
        isNew: boolean
        isFeatured: boolean
        category?: { name: string } | null
    }
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart()
    const [showSizePicker, setShowSizePicker] = useState(false)
    const [addedToast, setAddedToast] = useState(false)

    const handleQuickAdd = (variant: { id: string; size: string | null; stockQty: number }) => {
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

        setShowSizePicker(false)
        setAddedToast(true)
        setTimeout(() => setAddedToast(false), 3000)
    }

    return (
        <div className="group relative">
            <div className="relative aspect-[3/4] bg-obsidian-100 rounded-sm overflow-hidden mb-3">
                {/* Primary Image */}
                {product.images[0] ? (
                    <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-opacity duration-400 ${product.images[1] ? 'group-hover:opacity-0' : 'group-hover:brightness-105'}`}
                    />
                ) : (
                    <div className="w-full h-full bg-obsidian-200 flex items-center justify-center text-obsidian-400 text-sm">
                        No Image
                    </div>
                )}

                {/* Secondary Image (hover swap) */}
                {product.images[1] && (
                    <img
                        src={product.images[1].imageUrl}
                        alt={`${product.name} alternate view`}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                        loading="lazy"
                    />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.isNew && (
                        <span className="bg-obsidian-900 text-white text-[10px] font-semibold px-2.5 py-1 tracking-[0.08em] uppercase rounded-[2px]">New</span>
                    )}
                    {product.isFeatured && (
                        <span className="bg-gold-500 text-white text-[10px] font-semibold px-2.5 py-1 tracking-[0.08em] uppercase rounded-[2px]">Featured</span>
                    )}
                </div>

                {/* Wishlist Button */}
                <WishlistButton
                    productId={product.id}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur opacity-0 group-hover:opacity-100 hover:bg-white focus-visible:opacity-100"
                />

                {/* Quick Add / Size Picker */}
                <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!showSizePicker ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (product.variants.length === 1) {
                                    handleQuickAdd(product.variants[0])
                                } else {
                                    setShowSizePicker(true)
                                }
                            }}
                            className="w-full bg-white/95 backdrop-blur text-obsidian-900 py-3 text-[13px] font-medium tracking-wide rounded-sm hover:bg-white transition-colors shadow-sm"
                        >
                            {product.variants.length === 1 ? 'Quick Add' : 'Select Size'}
                        </button>
                    ) : (
                        <div className="bg-white/95 backdrop-blur rounded-sm shadow-sm p-2 animate-scale-in" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                {product.variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => handleQuickAdd(variant)}
                                        disabled={variant.stockQty === 0}
                                        className={`min-w-[36px] h-8 px-2 text-xs font-medium rounded-sm transition-colors
                                            ${variant.stockQty === 0
                                                ? 'text-obsidian-300 line-through cursor-not-allowed bg-obsidian-50'
                                                : 'text-obsidian-900 bg-white hover:bg-obsidian-900 hover:text-white border border-obsidian-200'
                                            }`}
                                    >
                                        {variant.size || 'OS'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Info */}
            <Link href={`/product/${product.slug}`} className="block">
                <h3 className="text-sm font-medium text-obsidian-900 mb-1 group-hover:underline underline-offset-2 decoration-obsidian-300 transition-all">
                    {product.name}
                </h3>
                {product.descriptionShort && (
                    <p className="text-[13px] text-obsidian-600 mb-2 line-clamp-1 leading-relaxed">{product.descriptionShort}</p>
                )}
                <p className="text-[15px] font-semibold text-obsidian-900 font-tabular tracking-[0.02em]">{formatCurrency(product.basePrice)}</p>
            </Link>

            {/* Added to Bag Toast */}
            {addedToast && (
                <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-72 bg-obsidian-900 text-white px-4 py-3 rounded-sm shadow-lg z-50 animate-fade-in-up text-sm">
                    Added to bag
                </div>
            )}
        </div>
    )
}
