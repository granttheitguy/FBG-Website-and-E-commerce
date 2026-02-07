import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Ruler, Clock } from "lucide-react"

export default async function AccountMeasurementsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const measurements = await prisma.customerMeasurement.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
    })

    const measurementFields: { label: string; key: string; unit: string }[] = [
        { label: "Chest", key: "chest", unit: "cm" },
        { label: "Shoulder", key: "shoulder", unit: "cm" },
        { label: "Sleeve Length", key: "sleeveLength", unit: "cm" },
        { label: "Neck", key: "neck", unit: "cm" },
        { label: "Back Length", key: "backLength", unit: "cm" },
        { label: "Waist", key: "waist", unit: "cm" },
        { label: "Hip", key: "hip", unit: "cm" },
        { label: "Inseam", key: "inseam", unit: "cm" },
        { label: "Outseam", key: "outseam", unit: "cm" },
        { label: "Thigh", key: "thigh", unit: "cm" },
        { label: "Height", key: "height", unit: "cm" },
        { label: "Weight", key: "weight", unit: "kg" },
    ]

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    My Measurements
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    Your body measurements recorded by our team.
                </p>
            </div>

            {measurements.length === 0 ? (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-obsidian-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ruler className="w-8 h-8 text-obsidian-400" />
                    </div>
                    <h3 className="text-lg font-medium text-obsidian-900 mb-2">
                        No measurements yet
                    </h3>
                    <p className="text-sm text-obsidian-500 max-w-sm mx-auto">
                        Visit our store or book a consultation to have your measurements taken by our expert tailors.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {measurements.map((measurement) => {
                        const hasValues = measurementFields.some(
                            (f) => (measurement as Record<string, unknown>)[f.key] != null
                        )

                        return (
                            <div
                                key={measurement.id}
                                className="bg-white rounded-sm border border-obsidian-200 shadow-sm"
                            >
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-obsidian-100">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-medium text-obsidian-900">
                                            {measurement.label}
                                        </h2>
                                        <div className="flex items-center gap-3 text-xs text-obsidian-400">
                                            {measurement.measuredBy && (
                                                <span>Measured by {measurement.measuredBy}</span>
                                            )}
                                            {measurement.measuredAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" aria-hidden="true" />
                                                    {formatDate(measurement.measuredAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Measurements Grid */}
                                <div className="p-6">
                                    {!hasValues ? (
                                        <p className="text-sm text-obsidian-400">
                                            No measurements recorded for this profile.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4 gap-x-6">
                                            {measurementFields.map((field) => {
                                                const value = (measurement as Record<string, unknown>)[field.key]
                                                if (value == null) return null
                                                return (
                                                    <div key={field.key}>
                                                        <p className="text-[11px] text-obsidian-400 uppercase tracking-wider">
                                                            {field.label}
                                                        </p>
                                                        <p className="text-base font-medium text-obsidian-900 font-tabular mt-0.5">
                                                            {value as number}
                                                            <span className="text-obsidian-400 text-sm ml-0.5">
                                                                {field.unit}
                                                            </span>
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {measurement.notes && (
                                        <div className="mt-4 pt-4 border-t border-obsidian-100">
                                            <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-1">
                                                Notes
                                            </p>
                                            <p className="text-sm text-obsidian-600">
                                                {measurement.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
