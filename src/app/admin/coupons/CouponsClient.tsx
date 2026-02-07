"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Coupon = {
    id: string
    code: string
    type: string
    value: number
    minOrderAmount: number | null
    maxUses: number | null
    usedCount: number
    isActive: boolean
    startsAt: string | null
    expiresAt: string | null
    createdAt: string
    updatedAt: string
}

type Props = {
    coupons: Coupon[]
}

export default function CouponsClient({ coupons }: Props) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        code: "",
        type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
        value: "",
        minOrderAmount: "",
        maxUses: "",
        isActive: true,
        startsAt: "",
        expiresAt: "",
    })

    const resetForm = () => {
        setFormData({
            code: "",
            type: "PERCENTAGE",
            value: "",
            minOrderAmount: "",
            maxUses: "",
            isActive: true,
            startsAt: "",
            expiresAt: "",
        })
        setEditingCoupon(null)
        setError("")
    }

    const openCreateModal = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon)
        setFormData({
            code: coupon.code,
            type: coupon.type as "PERCENTAGE" | "FIXED",
            value: coupon.value.toString(),
            minOrderAmount: coupon.minOrderAmount?.toString() || "",
            maxUses: coupon.maxUses?.toString() || "",
            isActive: coupon.isActive,
            startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().split("T")[0] : "",
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
        })
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
                code: formData.code.toUpperCase(),
                type: formData.type,
                value: parseFloat(formData.value),
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                isActive: formData.isActive,
                startsAt: formData.startsAt || null,
                expiresAt: formData.expiresAt || null,
            }

            const url = editingCoupon
                ? `/api/admin/coupons/${editingCoupon.id}`
                : `/api/admin/coupons`

            const method = editingCoupon ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to save coupon")
            }

            router.refresh()
            closeModal()
        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (coupon: Coupon) => {
        if (coupon.usedCount > 0) {
            if (!confirm(`This coupon has been used ${coupon.usedCount} times. Are you sure you want to deactivate it instead?`)) {
                return
            }
            // Deactivate instead
            try {
                const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: false }),
                })

                if (!response.ok) {
                    throw new Error("Failed to deactivate coupon")
                }

                router.refresh()
            } catch (err: any) {
                alert(err.message || "An error occurred")
            }
            return
        }

        if (!confirm(`Delete coupon "${coupon.code}"? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
                method: "DELETE",
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete coupon")
            }

            router.refresh()
        } catch (err: any) {
            alert(err.message || "An error occurred")
        }
    }

    return (
        <>
            <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
            </Button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-obsidian-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                                {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-full hover:bg-obsidian-100 flex items-center justify-center text-obsidian-500 hover:text-obsidian-900"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label htmlFor="code">Coupon Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="SUMMER2026"
                                        required
                                        className="uppercase"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="type">Discount Type *</Label>
                                    <select
                                        id="type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as "PERCENTAGE" | "FIXED" })}
                                        className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                                        required
                                    >
                                        <option value="PERCENTAGE">Percentage</option>
                                        <option value="FIXED">Fixed Amount</option>
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="value">
                                        {formData.type === "PERCENTAGE" ? "Percentage (%)" : "Amount (₦)"} *
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        placeholder={formData.type === "PERCENTAGE" ? "20" : "5000"}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="minOrderAmount">Minimum Order Amount (₦)</Label>
                                    <Input
                                        id="minOrderAmount"
                                        type="number"
                                        step="0.01"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        placeholder="10000"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="maxUses">Maximum Uses</Label>
                                    <Input
                                        id="maxUses"
                                        type="number"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        placeholder="100"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="startsAt">Start Date</Label>
                                    <Input
                                        id="startsAt"
                                        type="date"
                                        value={formData.startsAt}
                                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="expiresAt">Expiry Date</Label>
                                    <Input
                                        id="expiresAt"
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2 flex items-center gap-2">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-obsidian-300 text-gold-500 focus:ring-gold-500"
                                    />
                                    <Label htmlFor="isActive" className="cursor-pointer">
                                        Coupon is active
                                    </Label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-obsidian-200">
                                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1">
                                    {isLoading ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="hidden">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex gap-2">
                        <button
                            onClick={() => openEditModal(coupon)}
                            className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-sm hover:bg-obsidian-100 text-obsidian-600 hover:text-obsidian-900"
                            aria-label="Edit coupon"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(coupon)}
                            className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-sm hover:bg-red-50 text-red-600 hover:text-red-700"
                            aria-label="Delete coupon"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </>
    )
}
