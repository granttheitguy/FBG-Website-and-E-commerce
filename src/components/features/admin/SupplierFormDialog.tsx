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
import type { SupplierDetail } from "@/types/erp"

interface SupplierFormDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: SupplierFormData) => Promise<void>
    supplier?: SupplierDetail | null
}

export interface SupplierFormData {
    name: string
    contactName: string
    email: string
    phone: string
    whatsapp: string
    address: string
    city: string
    state: string
    notes: string
}

export default function SupplierFormDialog({
    open,
    onClose,
    onSubmit,
    supplier,
}: SupplierFormDialogProps) {
    const isEdit = !!supplier
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [form, setForm] = useState<SupplierFormData>({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        notes: "",
    })

    useEffect(() => {
        if (supplier) {
            setForm({
                name: supplier.name,
                contactName: supplier.contactName || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                whatsapp: supplier.whatsapp || "",
                address: supplier.address || "",
                city: supplier.city || "",
                state: supplier.state || "",
                notes: supplier.notes || "",
            })
        } else {
            setForm({
                name: "",
                contactName: "",
                email: "",
                phone: "",
                whatsapp: "",
                address: "",
                city: "",
                state: "",
                notes: "",
            })
        }
        setError("")
    }, [supplier, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await onSubmit(form)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save supplier")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Supplier" : "Add Supplier"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update supplier contact information."
                            : "Add a new fabric supplier to the system."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-sm text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="supplierName">Company Name *</Label>
                        <Input
                            id="supplierName"
                            required
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Supplier company name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="supplierContactName">Contact Person</Label>
                        <Input
                            id="supplierContactName"
                            value={form.contactName}
                            onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                            placeholder="Contact person name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="supplierEmail">Email</Label>
                            <Input
                                id="supplierEmail"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                placeholder="supplier@email.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="supplierPhone">Phone</Label>
                            <Input
                                id="supplierPhone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                placeholder="+234..."
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="supplierWhatsapp">WhatsApp</Label>
                        <Input
                            id="supplierWhatsapp"
                            type="tel"
                            value={form.whatsapp}
                            onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                            placeholder="+234..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="supplierAddress">Address</Label>
                        <Input
                            id="supplierAddress"
                            value={form.address}
                            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                            placeholder="Street address"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="supplierCity">City</Label>
                            <Input
                                id="supplierCity"
                                value={form.city}
                                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                placeholder="e.g., Lagos"
                            />
                        </div>
                        <div>
                            <Label htmlFor="supplierState">State</Label>
                            <Input
                                id="supplierState"
                                value={form.state}
                                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                                placeholder="e.g., Lagos"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="supplierNotes">Notes</Label>
                        <textarea
                            id="supplierNotes"
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors min-h-[60px] resize-y"
                            value={form.notes}
                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                            placeholder="Specialty, payment terms, delivery notes..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEdit ? "Update Supplier" : "Add Supplier"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
