"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { createShippingRate, updateShippingRate } from "../actions"

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
}

interface ShippingRateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    rate?: ShippingRate | null
    zones: ShippingZone[]
    defaultZoneId?: string
}

export function ShippingRateDialog({
    open,
    onOpenChange,
    rate,
    zones,
    defaultZoneId,
}: ShippingRateDialogProps) {
    const isEditing = !!rate
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)

        try {
            const result = isEditing
                ? await updateShippingRate(rate!.id, formData)
                : await createShippingRate(formData)

            if (result.success) {
                onOpenChange(false)
            } else {
                setError(result.message)
            }
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-obsidian-900">
                        {isEditing ? "Edit Shipping Rate" : "Add Shipping Rate"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the shipping rate details."
                            : "Add a new shipping rate to a zone."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="rate-zone">Shipping Zone</Label>
                        <select
                            id="rate-zone"
                            name="shippingZoneId"
                            defaultValue={rate?.shippingZoneId ?? defaultZoneId ?? ""}
                            required
                            className="mt-1 w-full rounded-sm border border-obsidian-200 bg-white px-3 py-2 text-sm focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900"
                        >
                            <option value="" disabled>
                                Select a zone
                            </option>
                            {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>
                                    {zone.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="rate-name">Rate Name</Label>
                        <Input
                            id="rate-name"
                            name="name"
                            defaultValue={rate?.name ?? ""}
                            placeholder="e.g., Standard Delivery"
                            required
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="rate-price">Price (NGN)</Label>
                        <Input
                            id="rate-price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={rate?.price ?? ""}
                            placeholder="e.g., 2500"
                            required
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="rate-days">Estimated Days</Label>
                        <Input
                            id="rate-days"
                            name="estimatedDays"
                            defaultValue={rate?.estimatedDays ?? ""}
                            placeholder="e.g., 3-5"
                            required
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="rate-isActive"
                            name="isActive"
                            value="true"
                            defaultChecked={rate?.isActive ?? true}
                            className="rounded-sm border-obsidian-300 text-obsidian-900 focus:ring-obsidian-900"
                        />
                        <Label htmlFor="rate-isActive">Active</Label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-sm text-sm">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEditing ? "Update Rate" : "Add Rate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
