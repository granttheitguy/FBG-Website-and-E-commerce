"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils"

type StockMovement = {
    id: string
    type: string
    quantity: number
    reason: string | null
    createdAt: string
    createdBy: {
        id: string
        name: string
        email: string
    } | null
}

type Variant = {
    id: string
    productId: string
    sku: string
    size: string | null
    color: string | null
    stockQty: number
    priceOverride: number | null
    status: string
    createdAt: string
    updatedAt: string
    product: {
        id: string
        name: string
        slug: string
        status: string
    }
    stockMovements: StockMovement[]
}

type Props = {
    variants: Variant[]
}

export default function InventoryClient({ variants }: Props) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [showLowStockOnly, setShowLowStockOnly] = useState(false)
    const [expandedVariant, setExpandedVariant] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        productVariantId: "",
        type: "ADJUSTMENT" as "ADJUSTMENT" | "SALE" | "RETURN" | "RESTOCK",
        quantity: "",
        reason: "",
    })

    const resetForm = () => {
        setFormData({
            productVariantId: "",
            type: "ADJUSTMENT",
            quantity: "",
            reason: "",
        })
        setError("")
    }

    const openModal = (variantId?: string) => {
        resetForm()
        if (variantId) {
            setFormData((prev) => ({ ...prev, productVariantId: variantId }))
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        resetForm()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const payload = {
                productVariantId: formData.productVariantId,
                type: formData.type,
                quantity: parseInt(formData.quantity),
                reason: formData.reason,
            }

            const response = await fetch("/api/admin/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create stock adjustment")
            }

            router.refresh()
            closeModal()
        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredVariants = variants.filter(v => {
        const matchesSearch = searchQuery === "" ||
            v.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.sku.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesLowStock = !showLowStockOnly || v.stockQty <= 5

        return matchesSearch && matchesLowStock
    })

    const selectedVariant = variants.find(v => v.id === formData.productVariantId)

    return (
        <>
            <div className="bg-white rounded-sm border border-obsidian-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
                            <Input
                                type="text"
                                placeholder="Search by product name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLowStockOnly}
                                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                                className="w-4 h-4 rounded border-obsidian-300 text-gold-500 focus:ring-gold-500"
                            />
                            <span className="text-sm text-obsidian-700">Low stock only</span>
                        </label>
                        <Button onClick={() => openModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Stock Adjustment
                        </Button>
                    </div>
                </div>

                {filteredVariants.length !== variants.length && (
                    <div className="mt-3 text-sm text-obsidian-600">
                        Showing {filteredVariants.length} of {variants.length} variants
                    </div>
                )}
            </div>

            {/* Stock Movements Section - show for expanded variants */}
            {expandedVariant && (
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-serif font-bold text-obsidian-900">Recent Stock Movements</h3>
                        <button
                            onClick={() => setExpandedVariant(null)}
                            className="w-8 h-8 rounded-full hover:bg-obsidian-100 flex items-center justify-center text-obsidian-500"
                            aria-label="Close movements"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {(() => {
                        const variant = variants.find(v => v.id === expandedVariant)
                        if (!variant || variant.stockMovements.length === 0) {
                            return <p className="text-obsidian-500 text-sm">No stock movements yet</p>
                        }
                        return (
                            <div className="space-y-2">
                                {variant.stockMovements.map((movement) => (
                                    <div key={movement.id} className="flex items-center justify-between p-3 bg-obsidian-50 rounded-sm">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                    movement.type === "RESTOCK" || movement.type === "RETURN" ? "bg-green-100 text-green-800" :
                                                    movement.type === "SALE" ? "bg-blue-100 text-blue-800" :
                                                    "bg-obsidian-200 text-obsidian-800"
                                                }`}>
                                                    {movement.type}
                                                </span>
                                                <span className={`font-semibold font-tabular ${movement.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                                                </span>
                                                {movement.reason && (
                                                    <span className="text-sm text-obsidian-600">{movement.reason}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-obsidian-500 mt-1">
                                                {formatDate(movement.createdAt)} • {movement.createdBy?.name || "System"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm shadow-xl max-w-lg w-full">
                        <div className="bg-white border-b border-obsidian-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                                Stock Adjustment
                            </h2>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-full hover:bg-obsidian-100 flex items-center justify-center text-obsidian-500 hover:text-obsidian-900"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="productVariantId">Product Variant *</Label>
                                <select
                                    id="productVariantId"
                                    value={formData.productVariantId}
                                    onChange={(e) => setFormData({ ...formData, productVariantId: e.target.value })}
                                    className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                                    required
                                >
                                    <option value="">Select variant</option>
                                    {variants.map((variant) => (
                                        <option key={variant.id} value={variant.id}>
                                            {variant.product.name} - {variant.sku} (Current: {variant.stockQty})
                                        </option>
                                    ))}
                                </select>
                                {selectedVariant && (
                                    <div className="mt-2 text-sm text-obsidian-600">
                                        Current stock: <span className="font-semibold font-tabular">{selectedVariant.stockQty}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="type">Adjustment Type *</Label>
                                <select
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                                    required
                                >
                                    <option value="ADJUSTMENT">Manual Adjustment</option>
                                    <option value="RESTOCK">Restock</option>
                                    <option value="SALE">Sale (Decrease)</option>
                                    <option value="RETURN">Return (Increase)</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="quantity">Quantity Change *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="Enter positive for increase, negative for decrease"
                                    required
                                />
                                <p className="text-xs text-obsidian-500 mt-1">
                                    Use positive numbers to increase stock, negative to decrease
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="reason">Reason *</Label>
                                <textarea
                                    id="reason"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 min-h-[80px]"
                                    placeholder="Explain the reason for this adjustment"
                                    required
                                />
                            </div>

                            {selectedVariant && formData.quantity && (
                                <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-sm">
                                    <div className="text-sm text-blue-900">
                                        New stock level will be: <span className="font-semibold font-tabular">
                                            {selectedVariant.stockQty + parseInt(formData.quantity || "0")}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-obsidian-200">
                                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1">
                                    {isLoading ? "Saving..." : "Create Adjustment"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .hidden { display: none; }
            `}</style>
        </>
    )
}
