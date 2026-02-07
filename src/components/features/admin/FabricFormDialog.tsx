"use client"

import { useState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { FabricDetail } from "@/types/erp"

interface SupplierOption {
    id: string
    name: string
}

interface FabricFormDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: FabricFormData) => Promise<void>
    fabric?: FabricDetail | null
    suppliers: SupplierOption[]
}

export interface FabricFormData {
    name: string
    type: string
    color: string
    pattern: string
    quantityYards: string
    minStockLevel: string
    costPerYard: string
    supplierId: string
    location: string
    notes: string
}

const FABRIC_TYPES = [
    "Cotton",
    "Silk",
    "Linen",
    "Wool",
    "Ankara",
    "Lace",
    "Aso Oke",
    "Adire",
    "Brocade",
    "Chiffon",
    "Satin",
    "Velvet",
    "Organza",
    "Denim",
    "Other",
]

export default function FabricFormDialog({
    open,
    onClose,
    onSubmit,
    fabric,
    suppliers,
}: FabricFormDialogProps) {
    const isEdit = !!fabric
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [form, setForm] = useState<FabricFormData>({
        name: "",
        type: "Cotton",
        color: "",
        pattern: "",
        quantityYards: "0",
        minStockLevel: "5",
        costPerYard: "",
        supplierId: "",
        location: "",
        notes: "",
    })

    useEffect(() => {
        if (fabric) {
            setForm({
                name: fabric.name,
                type: fabric.type,
                color: fabric.color || "",
                pattern: fabric.pattern || "",
                quantityYards: fabric.quantityYards.toString(),
                minStockLevel: fabric.minStockLevel.toString(),
                costPerYard: fabric.costPerYard?.toString() || "",
                supplierId: fabric.supplierId || "",
                location: fabric.location || "",
                notes: fabric.notes || "",
            })
        } else {
            setForm({
                name: "",
                type: "Cotton",
                color: "",
                pattern: "",
                quantityYards: "0",
                minStockLevel: "5",
                costPerYard: "",
                supplierId: "",
                location: "",
                notes: "",
            })
        }
        setError("")
    }, [fabric, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await onSubmit(form)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save fabric")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Fabric" : "Add Fabric"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update fabric inventory details."
                            : "Add a new fabric to inventory."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-sm text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="fabricName">Name *</Label>
                        <Input
                            id="fabricName"
                            required
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g., Navy Blue Italian Cotton"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="fabricType">Type *</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
                            >
                                <SelectTrigger id="fabricType">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FABRIC_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="fabricColor">Color</Label>
                            <Input
                                id="fabricColor"
                                value={form.color}
                                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                                placeholder="e.g., Navy Blue"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="fabricPattern">Pattern</Label>
                        <Input
                            id="fabricPattern"
                            value={form.pattern}
                            onChange={(e) => setForm((p) => ({ ...p, pattern: e.target.value }))}
                            placeholder="e.g., Solid, Striped, Floral..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="fabricQty">Quantity (yards) *</Label>
                            <Input
                                id="fabricQty"
                                type="number"
                                min="0"
                                step="0.5"
                                required
                                value={form.quantityYards}
                                onChange={(e) => setForm((p) => ({ ...p, quantityYards: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="fabricMinStock">Reorder Level</Label>
                            <Input
                                id="fabricMinStock"
                                type="number"
                                min="0"
                                step="0.5"
                                value={form.minStockLevel}
                                onChange={(e) => setForm((p) => ({ ...p, minStockLevel: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="fabricCost">Cost/Yard (NGN)</Label>
                            <Input
                                id="fabricCost"
                                type="number"
                                min="0"
                                step="100"
                                value={form.costPerYard}
                                onChange={(e) => setForm((p) => ({ ...p, costPerYard: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="fabricSupplier">Supplier</Label>
                        <Select
                            value={form.supplierId || "none"}
                            onValueChange={(v) => setForm((p) => ({ ...p, supplierId: v === "none" ? "" : v }))}
                        >
                            <SelectTrigger id="fabricSupplier">
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No supplier</SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="fabricLocation">Storage Location</Label>
                        <Input
                            id="fabricLocation"
                            value={form.location}
                            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                            placeholder="e.g., Shelf A-3, Warehouse B"
                        />
                    </div>

                    <div>
                        <Label htmlFor="fabricNotes">Notes</Label>
                        <textarea
                            id="fabricNotes"
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors min-h-[60px] resize-y"
                            value={form.notes}
                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                            placeholder="Additional notes..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEdit ? "Update Fabric" : "Add Fabric"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
