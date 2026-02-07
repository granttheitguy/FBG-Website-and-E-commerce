"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Truck, Plus, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/EmptyState"
import SupplierFormDialog, { type SupplierFormData } from "@/components/features/admin/SupplierFormDialog"
import { createSupplier, updateSupplier } from "./actions"
import type { SupplierDetail } from "@/types/erp"

interface SuppliersPageClientProps {
    suppliers: SupplierDetail[]
    total: number
    page: number
    totalPages: number
    currentSearch: string
    skip: number
    limit: number
}

export default function SuppliersPageClient({
    suppliers,
    total,
    page,
    totalPages,
    currentSearch,
    skip,
    limit,
}: SuppliersPageClientProps) {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<SupplierDetail | null>(null)

    const handleSubmit = async (data: SupplierFormData) => {
        if (editingSupplier) {
            const result = await updateSupplier(editingSupplier.id, {
                name: data.name,
                contactName: data.contactName || undefined,
                email: data.email || undefined,
                phone: data.phone || undefined,
                whatsapp: data.whatsapp || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                notes: data.notes || undefined,
            })
            if (result.error) throw new Error(result.error)
        } else {
            const result = await createSupplier({
                name: data.name,
                contactName: data.contactName || undefined,
                email: data.email || undefined,
                phone: data.phone || undefined,
                whatsapp: data.whatsapp || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state: data.state || undefined,
                notes: data.notes || undefined,
            })
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
                        Suppliers
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {total} supplier{total !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingSupplier(null)
                        setDialogOpen(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Supplier
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <form method="GET" className="flex gap-2">
                    <input
                        name="search"
                        type="text"
                        defaultValue={currentSearch}
                        placeholder="Search by name, contact, email, or phone..."
                        className="flex-1 h-10 rounded-sm border border-obsidian-200 bg-white px-4 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-4 h-10 rounded-sm bg-obsidian-900 text-white text-sm font-medium hover:bg-obsidian-800 transition-colors"
                        aria-label="Search suppliers"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Table */}
            {suppliers.length === 0 ? (
                <EmptyState
                    icon={<Truck className="w-8 h-8" />}
                    title="No suppliers yet"
                    description="Add your first fabric supplier to manage your supply chain."
                    action={{ label: "Add Supplier", href: "#" }}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden sm:table-cell">Contact</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Email</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Phone</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden lg:table-cell">Fabrics</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Location</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {suppliers.map((supplier) => (
                                    <tr
                                        key={supplier.id}
                                        className="hover:bg-obsidian-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/suppliers/${supplier.id}`}
                                                className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors"
                                            >
                                                {supplier.name}
                                            </Link>
                                            {!supplier.isActive && (
                                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-sm border border-red-100">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden sm:table-cell">
                                            {supplier.contactName || <span className="text-obsidian-300">--</span>}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {supplier.email ? (
                                                <span className="text-obsidian-600 truncate max-w-[200px] inline-block">
                                                    {supplier.email}
                                                </span>
                                            ) : (
                                                <span className="text-obsidian-300">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden md:table-cell">
                                            {supplier.phone || <span className="text-obsidian-300">--</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-tabular text-obsidian-600 hidden lg:table-cell">
                                            {supplier._count.fabrics}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden lg:table-cell whitespace-nowrap">
                                            {supplier.city && supplier.state
                                                ? `${supplier.city}, ${supplier.state}`
                                                : supplier.city || supplier.state || <span className="text-obsidian-300">--</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                className="text-xs text-obsidian-600 hover:text-obsidian-900 underline underline-offset-2 transition-colors"
                                                onClick={() => {
                                                    setEditingSupplier(supplier)
                                                    setDialogOpen(true)
                                                }}
                                                aria-label={`Edit ${supplier.name}`}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                                        href={`/admin/suppliers?${buildParams({
                                            search: currentSearch,
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
                                        href={`/admin/suppliers?${buildParams({
                                            search: currentSearch,
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

            {/* Supplier Form Dialog */}
            <SupplierFormDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setEditingSupplier(null)
                }}
                onSubmit={handleSubmit}
                supplier={editingSupplier}
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
