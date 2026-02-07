"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CustomerMeasurement, MeasurementFormData } from "@/types/crm"

interface CustomerMeasurementFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    measurement?: CustomerMeasurement | null
    onSubmit: (data: MeasurementFormData) => Promise<void>
}

const INITIAL_FORM: MeasurementFormData = {
    label: "Default",
    chest: "",
    shoulder: "",
    sleeveLength: "",
    neck: "",
    backLength: "",
    waist: "",
    hip: "",
    inseam: "",
    outseam: "",
    thigh: "",
    height: "",
    weight: "",
    notes: "",
    measuredBy: "",
    measuredAt: "",
}

function measurementToForm(m: CustomerMeasurement): MeasurementFormData {
    return {
        label: m.label,
        chest: m.chest ?? "",
        shoulder: m.shoulder ?? "",
        sleeveLength: m.sleeveLength ?? "",
        neck: m.neck ?? "",
        backLength: m.backLength ?? "",
        waist: m.waist ?? "",
        hip: m.hip ?? "",
        inseam: m.inseam ?? "",
        outseam: m.outseam ?? "",
        thigh: m.thigh ?? "",
        height: m.height ?? "",
        weight: m.weight ?? "",
        notes: m.notes ?? "",
        measuredBy: m.measuredBy ?? "",
        measuredAt: m.measuredAt ? new Date(m.measuredAt).toISOString().split("T")[0] : "",
    }
}

interface FieldGroupProps {
    title: string
    children: React.ReactNode
}

function FieldGroup({ title, children }: FieldGroupProps) {
    return (
        <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                {title}
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {children}
            </div>
        </fieldset>
    )
}

interface MeasurementFieldProps {
    id: string
    label: string
    value: number | string
    unit?: string
    onChange: (value: string) => void
}

function MeasurementField({ id, label, value, unit = "cm", onChange }: MeasurementFieldProps) {
    return (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-xs text-obsidian-600">
                {label} <span className="text-obsidian-400">({unit})</span>
            </Label>
            <Input
                id={id}
                type="number"
                step="0.1"
                min="0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0.0"
                className="h-10 text-sm"
            />
        </div>
    )
}

export default function CustomerMeasurementForm({
    open,
    onOpenChange,
    measurement,
    onSubmit,
}: CustomerMeasurementFormProps) {
    const [form, setForm] = useState<MeasurementFormData>(
        measurement ? measurementToForm(measurement) : INITIAL_FORM
    )
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Reset form when dialog opens/closes or measurement changes
    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setForm(measurement ? measurementToForm(measurement) : INITIAL_FORM)
            setError("")
        }
        onOpenChange(nextOpen)
    }

    const updateField = (key: keyof MeasurementFormData) => (value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await onSubmit(form)
            onOpenChange(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save measurement"
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const isEditing = !!measurement

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="font-serif font-bold tracking-[-0.02em]">
                        {isEditing ? "Edit Measurement Profile" : "Add Measurement Profile"}
                    </DialogTitle>
                    <DialogDescription className="text-obsidian-500">
                        Record body measurements in centimetres. Leave fields blank if not measured.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div
                            className="p-3 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {/* Label */}
                    <div className="space-y-1">
                        <Label htmlFor="measurement-label">Profile Label</Label>
                        <Input
                            id="measurement-label"
                            value={form.label}
                            onChange={(e) => updateField("label")(e.target.value)}
                            placeholder="e.g. Default, Wedding Suit, Agbada"
                            required
                            className="h-10"
                        />
                    </div>

                    {/* Upper Body */}
                    <FieldGroup title="Upper Body">
                        <MeasurementField
                            id="m-chest"
                            label="Chest"
                            value={form.chest}
                            onChange={updateField("chest")}
                        />
                        <MeasurementField
                            id="m-shoulder"
                            label="Shoulder"
                            value={form.shoulder}
                            onChange={updateField("shoulder")}
                        />
                        <MeasurementField
                            id="m-sleeve"
                            label="Sleeve Length"
                            value={form.sleeveLength}
                            onChange={updateField("sleeveLength")}
                        />
                        <MeasurementField
                            id="m-neck"
                            label="Neck"
                            value={form.neck}
                            onChange={updateField("neck")}
                        />
                        <MeasurementField
                            id="m-back"
                            label="Back Length"
                            value={form.backLength}
                            onChange={updateField("backLength")}
                        />
                    </FieldGroup>

                    {/* Lower Body */}
                    <FieldGroup title="Lower Body">
                        <MeasurementField
                            id="m-waist"
                            label="Waist"
                            value={form.waist}
                            onChange={updateField("waist")}
                        />
                        <MeasurementField
                            id="m-hip"
                            label="Hip"
                            value={form.hip}
                            onChange={updateField("hip")}
                        />
                        <MeasurementField
                            id="m-inseam"
                            label="Inseam"
                            value={form.inseam}
                            onChange={updateField("inseam")}
                        />
                        <MeasurementField
                            id="m-outseam"
                            label="Outseam"
                            value={form.outseam}
                            onChange={updateField("outseam")}
                        />
                        <MeasurementField
                            id="m-thigh"
                            label="Thigh"
                            value={form.thigh}
                            onChange={updateField("thigh")}
                        />
                    </FieldGroup>

                    {/* Additional */}
                    <FieldGroup title="Additional">
                        <MeasurementField
                            id="m-height"
                            label="Height"
                            value={form.height}
                            onChange={updateField("height")}
                        />
                        <MeasurementField
                            id="m-weight"
                            label="Weight"
                            value={form.weight}
                            unit="kg"
                            onChange={updateField("weight")}
                        />
                    </FieldGroup>

                    {/* Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="m-measuredBy">Measured By</Label>
                            <Input
                                id="m-measuredBy"
                                value={form.measuredBy}
                                onChange={(e) => updateField("measuredBy")(e.target.value)}
                                placeholder="Staff name"
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="m-measuredAt">Measured On</Label>
                            <Input
                                id="m-measuredAt"
                                type="date"
                                value={form.measuredAt}
                                onChange={(e) => updateField("measuredAt")(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <Label htmlFor="m-notes">Notes</Label>
                        <textarea
                            id="m-notes"
                            value={form.notes}
                            onChange={(e) => updateField("notes")(e.target.value)}
                            placeholder="Any additional notes about this measurement..."
                            rows={3}
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEditing ? "Update Measurement" : "Save Measurement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
