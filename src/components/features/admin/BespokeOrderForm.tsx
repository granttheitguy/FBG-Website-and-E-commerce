"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BespokeOrderFormProps {
    initialData?: {
        customerName?: string
        customerEmail?: string
        customerPhone?: string
        userId?: string
        designDescription?: string
        estimatedPrice?: number
        estimatedCompletionDate?: string
        internalNotes?: string
        customerNotes?: string
        fabricDetails?: string
    }
    mode: "create" | "edit"
    orderId?: string
}

interface CustomerSearchResult {
    id: string
    name: string
    email: string
}

export default function BespokeOrderForm({ initialData, mode, orderId }: BespokeOrderFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [customerSearch, setCustomerSearch] = useState("")
    const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)

    const [form, setForm] = useState({
        customerName: initialData?.customerName || "",
        customerEmail: initialData?.customerEmail || "",
        customerPhone: initialData?.customerPhone || "",
        userId: initialData?.userId || "",
        designDescription: initialData?.designDescription || "",
        estimatedPrice: initialData?.estimatedPrice?.toString() || "",
        estimatedCompletionDate: initialData?.estimatedCompletionDate
            ? initialData.estimatedCompletionDate.split("T")[0]
            : "",
        internalNotes: initialData?.internalNotes || "",
        customerNotes: initialData?.customerNotes || "",
        fabricDetails: initialData?.fabricDetails || "",
    })

    const searchCustomers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setCustomerResults([])
            setShowResults(false)
            return
        }

        setSearching(true)
        try {
            const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=5`)
            if (res.ok) {
                const data = await res.json()
                const results = (data.customers || []).map((c: { id: string; name: string; email: string }) => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                }))
                setCustomerResults(results)
                setShowResults(true)
            }
        } catch {
            // Silently fail customer search
        } finally {
            setSearching(false)
        }
    }, [])

    const handleCustomerSearchChange = (value: string) => {
        setCustomerSearch(value)
        // Debounce search
        const timeout = setTimeout(() => searchCustomers(value), 300)
        return () => clearTimeout(timeout)
    }

    const selectCustomer = (customer: CustomerSearchResult) => {
        setForm((prev) => ({
            ...prev,
            customerName: customer.name,
            customerEmail: customer.email,
            userId: customer.id,
        }))
        setCustomerSearch("")
        setShowResults(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const payload = {
                customerName: form.customerName,
                customerEmail: form.customerEmail || undefined,
                customerPhone: form.customerPhone,
                userId: form.userId || undefined,
                designDescription: form.designDescription || undefined,
                estimatedPrice: form.estimatedPrice ? parseFloat(form.estimatedPrice) : undefined,
                estimatedCompletionDate: form.estimatedCompletionDate || undefined,
                internalNotes: form.internalNotes || undefined,
                customerNotes: form.customerNotes || undefined,
                fabricDetails: form.fabricDetails || undefined,
            }

            const url = mode === "create"
                ? "/api/admin/bespoke"
                : `/api/admin/bespoke/${orderId}`

            const res = await fetch(url, {
                method: mode === "create" ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json()
                setError(data.error || "Something went wrong")
                return
            }

            const data = await res.json()

            if (mode === "create") {
                router.push(`/admin/bespoke/${data.id}`)
            } else {
                router.refresh()
            }
        } catch {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                    {error}
                </div>
            )}

            {/* Customer search */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                    Customer Information
                </h3>

                <div className="relative">
                    <Label htmlFor="customerSearch">Search Existing Customer</Label>
                    <Input
                        id="customerSearch"
                        placeholder="Search by name or email..."
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearchChange(e.target.value)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        onFocus={() => customerResults.length > 0 && setShowResults(true)}
                    />
                    {showResults && customerResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-obsidian-200 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                            {customerResults.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2.5 hover:bg-obsidian-50 transition-colors text-sm"
                                    onClick={() => selectCustomer(c)}
                                >
                                    <p className="font-medium text-obsidian-900">{c.name}</p>
                                    <p className="text-xs text-obsidian-500">{c.email}</p>
                                </button>
                            ))}
                        </div>
                    )}
                    {searching && (
                        <p className="text-xs text-obsidian-400 mt-1">Searching...</p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                            id="customerName"
                            required
                            value={form.customerName}
                            onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                            placeholder="Full name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="customerPhone">Phone *</Label>
                        <Input
                            id="customerPhone"
                            required
                            type="tel"
                            value={form.customerPhone}
                            onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                            placeholder="+234..."
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                        id="customerEmail"
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                        placeholder="customer@email.com"
                    />
                </div>
            </div>

            {/* Design details */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                    Design Details
                </h3>

                <div>
                    <Label htmlFor="designDescription">Design Description</Label>
                    <textarea
                        id="designDescription"
                        className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors min-h-[100px] resize-y"
                        value={form.designDescription}
                        onChange={(e) => setForm((p) => ({ ...p, designDescription: e.target.value }))}
                        placeholder="Describe the garment design, style preferences..."
                    />
                </div>

                <div>
                    <Label htmlFor="fabricDetails">Fabric Details</Label>
                    <textarea
                        id="fabricDetails"
                        className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors min-h-[80px] resize-y"
                        value={form.fabricDetails}
                        onChange={(e) => setForm((p) => ({ ...p, fabricDetails: e.target.value }))}
                        placeholder="Fabric type, color preferences, material notes..."
                    />
                </div>
            </div>

            {/* Pricing & timeline */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                    Pricing & Timeline
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="estimatedPrice">Estimated Price (NGN)</Label>
                        <Input
                            id="estimatedPrice"
                            type="number"
                            min="0"
                            step="100"
                            value={form.estimatedPrice}
                            onChange={(e) => setForm((p) => ({ ...p, estimatedPrice: e.target.value }))}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="estimatedCompletionDate">Estimated Completion</Label>
                        <Input
                            id="estimatedCompletionDate"
                            type="date"
                            value={form.estimatedCompletionDate}
                            onChange={(e) => setForm((p) => ({ ...p, estimatedCompletionDate: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                    Notes
                </h3>

                <div>
                    <Label htmlFor="customerNotes">Customer Notes</Label>
                    <textarea
                        id="customerNotes"
                        className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors min-h-[80px] resize-y"
                        value={form.customerNotes}
                        onChange={(e) => setForm((p) => ({ ...p, customerNotes: e.target.value }))}
                        placeholder="Notes visible to the customer..."
                    />
                </div>

                <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <textarea
                        id="internalNotes"
                        className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors min-h-[80px] resize-y"
                        value={form.internalNotes}
                        onChange={(e) => setForm((p) => ({ ...p, internalNotes: e.target.value }))}
                        placeholder="Internal staff notes (not visible to customer)..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-obsidian-200">
                <Button type="submit" loading={loading}>
                    {mode === "create" ? "Create Bespoke Order" : "Save Changes"}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}
