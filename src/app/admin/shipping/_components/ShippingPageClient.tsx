"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, MapPin, Truck } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShippingZoneDialog } from "./ShippingZoneDialog"
import { ShippingRateDialog } from "./ShippingRateDialog"
import { deleteShippingZone, deleteShippingRate } from "../actions"

interface ShippingRate {
    id: string
    shippingZoneId: string
    name: string
    price: number
    estimatedDays: string
    isActive: boolean
}

interface ShippingZone {
    id: string
    name: string
    states: string[]
    isActive: boolean
    rates: ShippingRate[]
}

interface ShippingPageClientProps {
    zones: ShippingZone[]
}

export function ShippingPageClient({ zones }: ShippingPageClientProps) {
    const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
    const [rateDialogOpen, setRateDialogOpen] = useState(false)
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
    const [editingRate, setEditingRate] = useState<ShippingRate | null>(null)
    const [defaultZoneId, setDefaultZoneId] = useState<string | undefined>()
    const [deleting, setDeleting] = useState<string | null>(null)

    function openCreateZone() {
        setEditingZone(null)
        setZoneDialogOpen(true)
    }

    function openEditZone(zone: ShippingZone) {
        setEditingZone(zone)
        setZoneDialogOpen(true)
    }

    function openCreateRate(zoneId: string) {
        setEditingRate(null)
        setDefaultZoneId(zoneId)
        setRateDialogOpen(true)
    }

    function openEditRate(rate: ShippingRate) {
        setEditingRate(rate)
        setDefaultZoneId(rate.shippingZoneId)
        setRateDialogOpen(true)
    }

    async function handleDeleteZone(zoneId: string) {
        if (!confirm("Delete this shipping zone and all its rates? This cannot be undone.")) return
        setDeleting(zoneId)
        await deleteShippingZone(zoneId)
        setDeleting(null)
    }

    async function handleDeleteRate(rateId: string) {
        if (!confirm("Delete this shipping rate?")) return
        setDeleting(rateId)
        await deleteShippingRate(rateId)
        setDeleting(null)
    }

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Shipping Management</h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Configure shipping zones and delivery rates for Nigerian states.
                    </p>
                </div>
                <Button onClick={openCreateZone} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Zone
                </Button>
            </div>

            {zones.length === 0 ? (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-12 text-center">
                    <MapPin className="w-12 h-12 text-obsidian-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-obsidian-900 mb-2">No shipping zones</h3>
                    <p className="text-sm text-obsidian-500 mb-6">
                        Create your first shipping zone to start configuring delivery rates.
                    </p>
                    <Button onClick={openCreateZone}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Zone
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {zones.map((zone) => {
                        const states = zone.states

                        return (
                            <div
                                key={zone.id}
                                className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden"
                            >
                                {/* Zone Header */}
                                <div className="px-6 py-4 bg-obsidian-50 border-b border-obsidian-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-obsidian-600" />
                                        <div>
                                            <h3 className="font-medium text-obsidian-900">{zone.name}</h3>
                                            <p className="text-xs text-obsidian-500 mt-0.5">
                                                {states.length} state{states.length !== 1 ? "s" : ""}: {states.slice(0, 5).join(", ")}
                                                {states.length > 5 && ` +${states.length - 5} more`}
                                            </p>
                                        </div>
                                        <span
                                            className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                zone.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-obsidian-100 text-obsidian-600"
                                            }`}
                                        >
                                            {zone.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openCreateRate(zone.id)}
                                            className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Rate
                                        </button>
                                        <button
                                            onClick={() => openEditZone(zone)}
                                            className="p-1.5 text-obsidian-400 hover:text-obsidian-900 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteZone(zone.id)}
                                            disabled={deleting === zone.id}
                                            className="p-1.5 text-obsidian-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Rates Table */}
                                {zone.rates.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <Truck className="w-8 h-8 text-obsidian-200 mx-auto mb-2" />
                                        <p className="text-sm text-obsidian-500">
                                            No delivery rates configured for this zone.
                                        </p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-obsidian-100">
                                            <tr>
                                                <th className="px-6 py-3 font-medium text-obsidian-600">Rate Name</th>
                                                <th className="px-6 py-3 font-medium text-obsidian-600">Price</th>
                                                <th className="px-6 py-3 font-medium text-obsidian-600">Est. Days</th>
                                                <th className="px-6 py-3 font-medium text-obsidian-600">Status</th>
                                                <th className="px-6 py-3 font-medium text-obsidian-600 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-obsidian-100">
                                            {zone.rates.map((rate) => (
                                                <tr key={rate.id} className="hover:bg-obsidian-50 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-obsidian-900">
                                                        {rate.name}
                                                    </td>
                                                    <td className="px-6 py-3 text-obsidian-900">
                                                        {rate.price === 0 ? "Free" : formatCurrency(rate.price)}
                                                    </td>
                                                    <td className="px-6 py-3 text-obsidian-600">
                                                        {rate.estimatedDays} days
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                rate.isActive
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-obsidian-100 text-obsidian-600"
                                                            }`}
                                                        >
                                                            {rate.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditRate(rate)}
                                                                className="p-1 text-obsidian-400 hover:text-obsidian-900 transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRate(rate.id)}
                                                                disabled={deleting === rate.id}
                                                                className="p-1 text-obsidian-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Dialogs */}
            <ShippingZoneDialog
                open={zoneDialogOpen}
                onOpenChange={setZoneDialogOpen}
                zone={editingZone}
            />

            <ShippingRateDialog
                open={rateDialogOpen}
                onOpenChange={setRateDialogOpen}
                rate={editingRate}
                zones={zones.map((z) => ({ id: z.id, name: z.name }))}
                defaultZoneId={defaultZoneId}
            />
        </>
    )
}
