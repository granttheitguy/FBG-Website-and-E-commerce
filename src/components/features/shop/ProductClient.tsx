"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Star, Truck, ShieldCheck, Minus, Plus } from "lucide-react"
import WishlistButton from "@/components/features/shop/WishlistButton"
import { formatCurrency } from "@/lib/utils"

interface ProductClientProps {
    product: {
        id: string
        name: string
        slug: string
        basePrice: number
        descriptionLong: string | null
        descriptionShort: string | null
        images: { imageUrl: string }[]
        variants: { id: string; size: string | null; stockQty: number }[]
        isNew: boolean
        isFeatured: boolean
    }
    averageRating?: number
    totalReviews?: number
}

export default function ProductClient({ product, averageRating = 0, totalReviews = 0 }: ProductClientProps) {
    const { addItem, setIsCartOpen } = useCart()
    const [selectedSize, setSelectedSize] = useState<string>("")
    const [quantity, setQuantity] = useState(1)
    const [sizeError, setSizeError] = useState(false)

    const handleAddToCart = () => {
        if (!selectedSize) {
            setSizeError(true)
            return
        }

        const selectedVariant = product.variants.find(v => v.size === selectedSize)
        if (!selectedVariant) return

        addItem({
            productId: product.id,
            variantId: selectedVariant.id,
            name: product.name,
            price: product.basePrice,
            image: product.images[0]?.imageUrl,
            quantity: quantity,
            size: selectedSize,
            slug: product.slug,
        })
        setIsCartOpen(true)
    }

    const handleSizeSelect = (size: string) => {
        setSelectedSize(size)
        setSizeError(false)
    }

    return (
        <>
            <div className="lg:pb-24">
                <div className="mb-8 border-b border-obsidian-200 pb-8">
                    <div className="flex items-center gap-2 mb-4">
                        {product.isNew && (
                            <span className="bg-obsidian-900 text-white text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-1 rounded-[2px]">
                                New Arrival
                            </span>
                        )}
                        {product.isFeatured && (
                            <span className="bg-gold-500 text-white text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-1 rounded-[2px]">
                                Featured
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-[-0.02em] text-obsidian-900 mb-4">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-4 mb-6">
                        <p className="text-2xl font-medium text-obsidian-900 font-tabular">
                            {formatCurrency(product.basePrice)}
                        </p>
                        <div className="flex items-center gap-1">
                            <div
                                className="flex items-center gap-0.5"
                                role="img"
                                aria-label={`${totalReviews > 0 ? averageRating.toFixed(1) : "0"} out of 5 stars`}
                            >
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                            i <= Math.round(averageRating)
                                                ? "fill-gold-500 text-gold-500"
                                                : "fill-obsidian-200 text-obsidian-200"
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-obsidian-500">
                                {totalReviews > 0
                                    ? `(${totalReviews} ${totalReviews === 1 ? "review" : "reviews"})`
                                    : "(No reviews yet)"}
                            </span>
                        </div>
                    </div>
                    <p className="text-obsidian-600 leading-relaxed">
                        {product.descriptionLong || product.descriptionShort || "Experience the finest craftsmanship with this premium piece from Fashion By Grant. Tailored to perfection using high-quality fabrics."}
                    </p>
                </div>

                {/* Selectors */}
                <div className="space-y-6 mb-8">
                    {/* Size Selector */}
                    <fieldset>
                        <div className="flex items-center justify-between mb-3">
                            <legend className="text-sm font-medium text-obsidian-900">Select Size</legend>
                            <button className="text-xs text-obsidian-500 underline hover:text-obsidian-900 transition-colors">
                                Size Guide
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Select size">
                            {product.variants.filter(v => v.size != null).map((variant) => (
                                <button
                                    key={variant.id}
                                    onClick={() => handleSizeSelect(variant.size!)}
                                    role="radio"
                                    aria-checked={selectedSize === variant.size}
                                    aria-label={`Size ${variant.size}${variant.stockQty === 0 ? ", out of stock" : ""}`}
                                    className={`w-12 h-12 flex items-center justify-center border rounded-sm text-sm transition-all
                                        ${variant.stockQty > 0
                                            ? selectedSize === variant.size
                                                ? "border-obsidian-900 bg-obsidian-900 text-white"
                                                : "border-obsidian-200 hover:border-obsidian-900 text-obsidian-900"
                                            : "border-obsidian-100 text-obsidian-300 cursor-not-allowed bg-obsidian-50"
                                        }
                                    `}
                                    disabled={variant.stockQty === 0}
                                >
                                    {variant.size}
                                </button>
                            ))}
                        </div>
                        {sizeError && (
                            <p
                                className="text-xs text-error mt-2 flex items-center gap-1"
                                role="alert"
                                aria-live="polite"
                            >
                                <span className="inline-block w-1 h-1 rounded-full bg-error" aria-hidden="true" />
                                Please select a size to continue
                            </p>
                        )}
                    </fieldset>

                    {/* Quantity */}
                    <div>
                        <span className="text-sm font-medium text-obsidian-900 block mb-3" id="quantity-label">
                            Quantity
                        </span>
                        <div
                            className="inline-flex items-center border border-obsidian-200 rounded-sm"
                            role="group"
                            aria-labelledby="quantity-label"
                        >
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                aria-label="Decrease quantity"
                                disabled={quantity <= 1}
                                className="w-12 h-12 flex items-center justify-center text-obsidian-500 hover:text-obsidian-900 disabled:text-obsidian-300 disabled:cursor-not-allowed transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <input
                                type="text"
                                value={quantity}
                                readOnly
                                aria-label="Current quantity"
                                className="w-12 text-center text-sm font-medium text-obsidian-900 bg-transparent focus:outline-none font-tabular"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                aria-label="Increase quantity"
                                className="w-12 h-12 flex items-center justify-center text-obsidian-500 hover:text-obsidian-900 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-obsidian-900 text-white py-4 rounded-sm font-medium hover:bg-gold-500 transition-colors shadow-lg shadow-obsidian-900/10"
                    >
                        Add to Cart
                    </button>
                    <WishlistButton
                        productId={product.id}
                        className="w-14 border border-obsidian-200 rounded-sm hover:border-obsidian-900"
                    />
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4 py-8 border-t border-obsidian-200">
                    <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-obsidian-400 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-obsidian-900">Free Delivery</h4>
                            <p className="text-xs text-obsidian-500 mt-1">On orders over NGN100k</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-obsidian-400 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-obsidian-900">Authentic Quality</h4>
                            <p className="text-xs text-obsidian-500 mt-1">Premium fabrics guaranteed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Bottom Bar */}
            <div
                className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-obsidian-200 p-3 z-40 lg:hidden"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="flex items-center gap-3 max-w-7xl mx-auto">
                    <div className="shrink-0">
                        <p className="text-lg font-medium text-obsidian-900 font-tabular">
                            {formatCurrency(product.basePrice)}
                        </p>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-obsidian-900 text-white py-3 rounded-sm font-medium hover:bg-gold-500 transition-colors text-sm"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </>
    )
}
