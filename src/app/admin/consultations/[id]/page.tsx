import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Calendar, Phone, Mail, Clock, User, MessageSquare } from "lucide-react"
import { ConsultationStatusSelect } from "./consultation-status-select"

const TYPE_LABELS: Record<string, string> = {
    measurement: "Measurement Session",
    wedding: "Wedding Consultation",
    fabric: "Fabric Consultation",
    pickup: "Pickup Arrangement",
}

export default async function AdminConsultationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const { id } = await params

    const booking = await prisma.consultationBooking.findUnique({
        where: { id },
    })

    if (!booking) {
        notFound()
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/consultations"
                    className="p-2 hover:bg-obsidian-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Back to consultations"
                >
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Consultation Booking
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-0.5">
                        #{booking.id.slice(-8).toUpperCase()}
                    </p>
                </div>
                <ConsultationStatusSelect
                    bookingId={booking.id}
                    currentStatus={booking.status}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Booking Details */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-5">
                            <Calendar className="w-4 h-4 text-obsidian-400" />
                            Booking Details
                        </h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <dt className="text-xs text-obsidian-500 mb-0.5">Type</dt>
                                <dd className="text-sm font-medium text-obsidian-900">
                                    {TYPE_LABELS[booking.type] || booking.type}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-obsidian-500 mb-0.5">Preferred Date</dt>
                                <dd className="text-sm font-medium text-obsidian-900">
                                    {booking.preferredDate
                                        ? new Date(booking.preferredDate).toLocaleDateString("en-NG", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })
                                        : "Not specified"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-obsidian-500 mb-0.5">Submitted</dt>
                                <dd className="text-sm text-obsidian-600">
                                    {new Date(booking.createdAt).toLocaleDateString("en-NG", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-obsidian-500 mb-0.5">Last Updated</dt>
                                <dd className="text-sm text-obsidian-600">
                                    {new Date(booking.updatedAt).toLocaleDateString("en-NG", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Message */}
                    {booking.message && (
                        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                                <MessageSquare className="w-4 h-4 text-obsidian-400" />
                                Customer Message
                            </h2>
                            <p className="text-sm text-obsidian-700 leading-relaxed whitespace-pre-wrap">
                                {booking.message}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-obsidian-400" />
                            Customer Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Name</p>
                                <p className="text-sm font-medium text-obsidian-900">{booking.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Phone</p>
                                <a
                                    href={`tel:${booking.phone}`}
                                    className="text-sm text-obsidian-900 hover:text-gold-600 inline-flex items-center gap-1.5 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    {booking.phone}
                                </a>
                            </div>
                            {booking.email && (
                                <div>
                                    <p className="text-xs text-obsidian-500 mb-0.5">Email</p>
                                    <a
                                        href={`mailto:${booking.email}`}
                                        className="text-sm text-obsidian-900 hover:text-gold-600 inline-flex items-center gap-1.5 transition-colors"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                        {booking.email}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <a
                                href={`https://wa.me/${booking.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center px-4 py-2.5 text-sm bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors min-h-[44px] flex items-center justify-center"
                            >
                                WhatsApp Customer
                            </a>
                            <a
                                href={`tel:${booking.phone}`}
                                className="block w-full text-center px-4 py-2.5 text-sm border border-obsidian-300 bg-white text-obsidian-900 rounded-sm hover:bg-obsidian-50 transition-colors min-h-[44px] flex items-center justify-center"
                            >
                                Call Customer
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
