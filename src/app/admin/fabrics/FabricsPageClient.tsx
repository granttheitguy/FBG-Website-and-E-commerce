"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Palette, Plus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import EmptyState from "@/components/ui/EmptyState"
import FabricFormDialog, { type FabricFormData } from "@/components/features/admin/FabricFormDialog"
import FabricStockAlert from "@/components/features/admin/FabricStockAlert"
import { createFabric, updateFabric } from "./actions"
import type { FabricDetail } from "@/types/erp"

interface FabricsPageClientProps {
    fabrics: FabricDetail[]
    suppliers: { id: string; name: string }[]
    total: number
    page: number
    totalPages: number
    lowStockCount: number
    currentSearch: string
    isLowStockFilter: boolean
    skip: number
    limit: number
}

export default function FabricsPageClient({
    fabrics,
    suppliers,
    total,
    page,
    totalPages,
    lowStockCount,
    currentSearch,
    isLowStockFilter,
    skip,
    limit,
}: FabricsPageClientProps) {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingFabric, setEditingFabric] = useState<FabricDetail | null>(null)

    const handleSubmit = async (data: FabricFormData) => {
        const payload = {
            name: data.name,
            type: data.type,
            color: data.color || undefined,
            pattern: data.pattern || undefined,
            quantityYards: parseFloat(data.quantityYards) || 0,
            minStockLevel: parseFloat(data.minStockLevel) || 0,
            costPerYard: data.costPerYard ? parseFloat(data.costPerYard) : undefined,
            supplierId: data.supplierId || undefined,
            location: data.location || undefined,
            notes: data.notes || undefined,
        }

        if (editingFabric) {
            const result = await updateFabric(editingFabric.id, payload)
            if (result.error) throw new Error(result.error)
        } else {
            const result = await createFabric(payload)
            if (result.error) throw new Error(result.error)
        }

        router.refresh()
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Fabric Inventory
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {total} fabric{total !== 1 ? "s" : ""}
                        {lowStockCount > 0 && (
                            <span className="text-red-600 ml-2">
                                ({lowStockCount} low stock)
                            </span>
                        )}
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingFabric(null)
                        setDialogOpen(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Fabric
                </Button>
            </div>

            {/* Search + Low stock filter */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <form method="GET" className="flex gap-2 flex-1">
                    <input
                        name="search"
                        type="text"
                        defaultValue={currentSearch}
                        placeholder="Search by name, type, color..."
                        className="flex-1 h-10 rounded-sm border border-obsidian-200 bg-white px-4 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                    />
                    {isLowStockFilter && <input type="hidden" name="lowStock" value="true" />}
                    <button
                        type="submit"
                        className="px-4 h-10 rounded-sm bg-obsidian-900 text-white text-sm font-medium hover:bg-obsidian-800 transition-colors"
                        aria-label="Search fabrics"
                    >
                        Search
                    </button>
                </form>

                <Link
                    href={`/admin/fabrics?${isLowStockFilter ? "" : "lowStock=true"}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`}
                    className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-sm text-sm font-medium transition-colors ${
                        isLowStockFilter
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "border border-obsidian-200 text-obsidian-600 hover:bg-obsidian-50"
                    }`}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Low Stock ({lowStockCount})
                </Link>
            </div>

            {/* Table */}
            {fabrics.length === 0 ? (
                <EmptyState
                    icon={<Palette className="w-8 h-8" />}
                    title="No fabrics in inventory"
                    description="Add your first fabric to start tracking inventory levels."
                    action={{ label: "Add Fabric", href: "#" }}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden sm:table-cell">Type</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Color</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Qty (yards)</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden md:table-cell">Min Level</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden lg:table-cell">Cost/Yard</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Supplier</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {fabrics.map((fabric) => {
                                    const isLowStock = fabric.minStockLevel > 0 && fabric.quantityYards <= fabric.minStockLevel

                                    return (
                                        <tr
                                            key={fabric.id}
                                            className={`hover:bg-obsidian-50/50 transition-colors ${
                                                isLowStock ? "bg-red-50/30" : ""
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/admin/fabrics/${fabric.id}`}
                                                    className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors"
                                                >
                                                    {fabric.name}
                                                </Link>
                                                {isLowStock && (
                                                    <div className="mt-1">
                                                        <FabricStockAlert
                                                            quantityYards={fabric.quantityYards}
                                                            minStockLevel={fabric.minStockLevel}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 hidden sm:table-cell">
                                                {fabric.type}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                {fabric.color ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="text-obsidian-600">{fabric.color}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-obsidian-300">--</span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-tabular ${
                                                isLowStock ? "text-red-600 font-medium" : "text-obsidian-900"
                                            }`}>
                                                {fabric.quantityYards.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-tabular text-obsidian-600 hidden md:table-cell">
                                                {fabric.minStockLevel > 0 ? fabric.minStockLevel.toFixed(1) : "--"}
                                            </td>
                                            <td className="px-6 py-4 text-right font-tabular text-obsidian-600 hidden lg:table-cell">
                                                {fabric.costPerYard ? formatCurrency(fabric.costPerYard) : "--"}
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 hidden lg:table-cell">
                                                {fabric.supplier ? (
                                                    <Link
                                                        href={`/admin/suppliers/${fabric.supplier.id}`}
                                                        className="text-gold-600 hover:underline text-xs"
                                                    >
                                                        {fabric.supplier.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-obsidian-300 text-xs">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    className="text-xs text-obsidian-600 hover:text-obsidian-900 underline underline-offset-2 transition-colors"
                                                    onClick={() => {
                                                        setEditingFabric(fabric)
                                                        setDialogOpen(true)
                                                    }}
                                                    aria-label={`Edit ${fabric.name}`}
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-obsidian-200 px-6 py-3">
                            <p className="text-sm text-obsidian-500">
                                Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/admin/fabrics?${buildParams({
                                            search: currentSearch,
                                            lowStock: isLowStockFilter ? "true" : "",
                                            page: String(page - 1),
                                        })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Link>
                                )}
                                <span className="text-sm text-obsidian-700 font-medium px-2">
                                    {page} / {totalPages}
                                </span>
                                {page < totalPages && (
                                    <Link
                                        href={`/admin/fabrics?${buildParams({
                                            search: currentSearch,
                                            lowStock: isLowStockFilter ? "true" : "",
                                            page: String(page + 1),
                                        })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fabric Form Dialog */}
            <FabricFormDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setEditingFabric(null)
                }}
                onSubmit={handleSubmit}
                fabric={editingFabric}
                suppliers={suppliers}
            />
        </div>
    )
}

function buildParams(params: Record<string, string>): string {
    const sp = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
        if (val) sp.set(key, val)
    }
    return sp.toString()
}
