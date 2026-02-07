"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2, Save, Plus, Trash2, Image as ImageIcon } from "lucide-react"

export default function ProductForm({ product }: { product?: any }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // State for dynamic fields
    const [images, setImages] = useState<string[]>(product?.images?.map((i: any) => i.imageUrl) || [""])
    const [variants, setVariants] = useState<any[]>(product?.variants || [{ size: "M", stockQty: 0, priceOverride: null }])

    const isEditing = !!product

    function handleAddImage() {
        setImages([...images, ""])
    }

    function handleImageChange(index: number, value: string) {
        const newImages = [...images]
        newImages[index] = value
        setImages(newImages)
    }

    function handleRemoveImage(index: number) {
        const newImages = images.filter((_, i) => i !== index)
        setImages(newImages)
    }

    function handleAddVariant() {
        setVariants([...variants, { size: "", stockQty: 0, priceOverride: null }])
    }

    function handleVariantChange(index: number, field: string, value: any) {
        const newVariants = [...variants]
        newVariants[index] = { ...newVariants[index], [field]: value }
        setVariants(newVariants)
    }

    function handleRemoveVariant(index: number) {
        const newVariants = variants.filter((_, i) => i !== index)
        setVariants(newVariants)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)

        const data = {
            name: formData.get("name"),
            slug: formData.get("slug"),
            descriptionShort: formData.get("descriptionShort"),
            descriptionLong: formData.get("descriptionLong"),
            basePrice: parseFloat(formData.get("basePrice") as string),
            status: formData.get("status"),
            isNew: formData.get("isNew") === "on",
            isFeatured: formData.get("isFeatured") === "on",
            images: images.filter(url => url.trim() !== ""),
            variants: variants
        }

        try {
            const url = isEditing ? `/api/admin/products/${product.id}` : "/api/admin/products"
            const method = isEditing ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || "Failed to save product")
            }

            router.push("/admin/products")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-medium text-obsidian-900">{isEditing ? "Edit Product" : "New Product"}</h1>
                        <p className="text-sm text-obsidian-500">{isEditing ? "Update product details and inventory." : "Create a new product in your catalog."}</p>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Product
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6 space-y-6">
                        <h2 className="text-lg font-medium text-obsidian-900">Basic Information</h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-obsidian-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    defaultValue={product?.name}
                                    required
                                    className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="slug" className="block text-sm font-medium text-obsidian-700 mb-1">Slug (URL)</label>
                                    <input
                                        type="text"
                                        name="slug"
                                        id="slug"
                                        defaultValue={product?.slug}
                                        required
                                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="basePrice" className="block text-sm font-medium text-obsidian-700 mb-1">Base Price</label>
                                    <input
                                        type="number"
                                        name="basePrice"
                                        id="basePrice"
                                        defaultValue={product?.basePrice}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="descriptionShort" className="block text-sm font-medium text-obsidian-700 mb-1">Short Description</label>
                                <textarea
                                    name="descriptionShort"
                                    id="descriptionShort"
                                    rows={2}
                                    defaultValue={product?.descriptionShort}
                                    className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                />
                            </div>

                            <div>
                                <label htmlFor="descriptionLong" className="block text-sm font-medium text-obsidian-700 mb-1">Long Description</label>
                                <textarea
                                    name="descriptionLong"
                                    id="descriptionLong"
                                    rows={5}
                                    defaultValue={product?.descriptionLong}
                                    className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-obsidian-900">Variants & Inventory</h2>
                            <button type="button" onClick={handleAddVariant} className="text-sm text-obsidian-600 hover:text-obsidian-900 font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add Variant
                            </button>
                        </div>

                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-obsidian-50 rounded-sm border border-obsidian-200">
                                    <div className="flex-1 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-obsidian-500 mb-1">Size</label>
                                            <input
                                                type="text"
                                                value={variant.size}
                                                onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                                                placeholder="e.g. M"
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 text-sm py-1.5 px-2 border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-obsidian-500 mb-1">Stock</label>
                                            <input
                                                type="number"
                                                value={variant.stockQty}
                                                onChange={(e) => handleVariantChange(index, "stockQty", parseInt(e.target.value))}
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 text-sm py-1.5 px-2 border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-obsidian-500 mb-1">Price Override (Optional)</label>
                                            <input
                                                type="number"
                                                value={variant.priceOverride || ""}
                                                onChange={(e) => handleVariantChange(index, "priceOverride", e.target.value ? parseFloat(e.target.value) : null)}
                                                placeholder="Default"
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 text-sm py-1.5 px-2 border"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(index)}
                                        className="mt-6 text-obsidian-400 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6 space-y-4">
                        <h2 className="text-sm font-medium text-obsidian-900 uppercase tracking-wider">Status</h2>
                        <select
                            name="status"
                            id="status"
                            defaultValue={product?.status || "ACTIVE"}
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Draft / Inactive</option>
                        </select>

                        <div className="space-y-2 pt-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="rounded border-obsidian-300 text-obsidian-900 focus:ring-obsidian-900" />
                                <span className="text-sm text-obsidian-700">Mark as New Arrival</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="rounded border-obsidian-300 text-obsidian-900 focus:ring-obsidian-900" />
                                <span className="text-sm text-obsidian-700">Mark as Featured</span>
                            </label>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-medium text-obsidian-900 uppercase tracking-wider">Images</h2>
                            <button type="button" onClick={handleAddImage} className="text-xs text-obsidian-600 hover:text-obsidian-900 font-medium flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add URL
                            </button>
                        </div>

                        <div className="space-y-3">
                            {images.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleImageChange(index, e.target.value)}
                                            placeholder="https://..."
                                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 text-xs py-2 px-2 border"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="text-obsidian-400 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {images.length === 0 && (
                                <p className="text-xs text-obsidian-500 italic">No images added.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
