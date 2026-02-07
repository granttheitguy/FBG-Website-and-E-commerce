"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Phone } from "lucide-react"

interface Booking {
    id: string
    name: string
    phone: string
    email: string | null
    type: string
    message: string | null
    status: string
    preferredDate: Date | null
    createdAt: Date
    updatedAt: Date
}

interface ConsultationsTableProps {
    bookings: Booking[]
    counts: {
        all: number
        pending: number
        confirmed: number
        completed: number
        cancelled: number
    }
    currentStatus: string
}

const STATUS_TABS = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
] as const

const STATUS_BADGE_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
}

const TYPE_LABELS: Record<string, string> = {
    measurement: "Measurement",
    wedding: "Wedding",
    fabric: "Fabric Consultation",
    pickup: "Pickup",
}

export function ConsultationsTable({ bookings, counts, currentStatus }: ConsultationsTableProps) {
    const router = useRouter()

    function handleTabChange(status: string) {
        const params = new URLSearchParams()
        if (status !== "ALL") {
            params.set("status", status)
        }
        const query = params.toString()
        router.push(`/admin/consultations${query ? `?${query}` : ""}`)
    }

    return (
        <div>
            {/* Status filter tabs */}
            <div className="flex gap-1 mb-4 flex-wrap">
                {STATUS_TABS.map((tab) => {
                    const count = counts[tab.key.toLowerCase() as keyof typeof counts]
                    const isActive = currentStatus === tab.key
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleTabChange(tab.key)}
                            className={`px-4 py-2 text-sm rounded-sm transition-colors min-h-[44px] flex items-center gap-2 ${
                                isActive
                                    ? "bg-obsidian-900 text-white"
                                    : "bg-white text-obsidian-600 hover:bg-obsidian-50 border border-obsidian-200"
                            }`}
                        >
                            {tab.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                isActive ? "bg-white/20" : "bg-obsidian-100"
                            }`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Phone</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Type</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Preferred Date</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Submitted</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-obsidian-500">
                                        <Calendar className="w-8 h-8 mx-auto mb-2 text-obsidian-300" />
                                        No consultation bookings found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-obsidian-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-obsidian-900">{booking.name}</p>
                                            {booking.email && (
                                                <p className="text-xs text-obsidian-500 mt-0.5">{booking.email}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-obsidian-600">
                                                <Phone className="w-3.5 h-3.5" />
                                                {booking.phone}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {TYPE_LABELS[booking.type] || booking.type}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {booking.preferredDate
                                                ? new Date(booking.preferredDate).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                STATUS_BADGE_STYLES[booking.status] || "bg-obsidian-100 text-obsidian-600"
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/consultations/${booking.id}`}
                                                className="text-obsidian-400 hover:text-obsidian-900 font-medium transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-obsidian-400 mt-3">
                Showing {bookings.length} bookings
            </p>
        </div>
    )
}
