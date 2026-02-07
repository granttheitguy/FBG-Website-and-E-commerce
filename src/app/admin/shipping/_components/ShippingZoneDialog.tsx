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
import { createShippingZone, updateShippingZone } from "../actions"

interface ShippingZone {
    id: string
    name: string
    states: string[]
    isActive: boolean
}

interface ShippingZoneDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    zone?: ShippingZone | null
}

const ALL_NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
    "Zamfara", "Abuja FCT",
]

export function ShippingZoneDialog({ open, onOpenChange, zone }: ShippingZoneDialogProps) {
    const isEditing = !!zone
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const existingStates: string[] = zone ? (zone.states as string[]) : []

    const [selectedStates, setSelectedStates] = useState<string[]>(existingStates)

    // Reset selected states when zone changes
    const [prevZone, setPrevZone] = useState<ShippingZone | null | undefined>(zone)
    if (zone !== prevZone) {
        setPrevZone(zone)
        if (zone) {
            setSelectedStates(zone.states as string[])
        } else {
            setSelectedStates([])
        }
    }

    function toggleState(state: string) {
        setSelectedStates((prev) =>
            prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        formData.set("states", JSON.stringify(selectedStates))

        if (selectedStates.length === 0) {
            setError("Please select at least one state")
            setLoading(false)
            return
        }

        try {
            const result = isEditing
                ? await updateShippingZone(zone!.id, formData)
                : await createShippingZone(formData)

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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-obsidian-900">
                        {isEditing ? "Edit Shipping Zone" : "Create Shipping Zone"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the shipping zone details."
                            : "Create a new shipping zone and assign states to it."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="zone-name">Zone Name</Label>
                        <Input
                            id="zone-name"
                            name="name"
                            defaultValue={zone?.name ?? ""}
                            placeholder="e.g., Lagos Zone"
                            required
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label>States</Label>
                        <p className="text-xs text-obsidian-500 mt-0.5 mb-2">
                            Select the states covered by this zone ({selectedStates.length} selected)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-60 overflow-y-auto border border-obsidian-200 rounded-sm p-3">
                            {ALL_NIGERIAN_STATES.map((state) => (
                                <label
                                    key={state}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                        selectedStates.includes(state)
                                            ? "bg-obsidian-900 text-white"
                                            : "bg-obsidian-50 text-obsidian-700 hover:bg-obsidian-100"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStates.includes(state)}
                                        onChange={() => toggleState(state)}
                                        className="sr-only"
                                    />
                                    {state}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="zone-isActive"
                            name="isActive"
                            value="true"
                            defaultChecked={zone?.isActive ?? true}
                            className="rounded-sm border-obsidian-300 text-obsidian-900 focus:ring-obsidian-900"
                        />
                        <Label htmlFor="zone-isActive">Active</Label>
                    </div>

                    {/* Hidden field for states JSON */}
                    <input type="hidden" name="states" value={JSON.stringify(selectedStates)} />

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
                            {isEditing ? "Update Zone" : "Create Zone"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
