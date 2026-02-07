import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    ShoppingBag,
    Ruler,
    Calendar,
} from "lucide-react"
import StaffCustomerInteractions from "@/components/features/staff/staff-customer-interactions"
import type { CustomerInteraction, InteractionType } from "@/types/crm"

export default async function StaffCustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user) {
        redirect("/staff/login")
    }

    const { id } = await params

    const customer = await prisma.user.findUnique({
        where: { id, role: "CUSTOMER" },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            lastLoginAt: true,
            profile: {
                select: {
                    phone: true,
                    defaultShippingAddress: true,
                    notes: true,
                },
            },
            measurements: {
                orderBy: { createdAt: "desc" },
            },
            orders: {
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    total: true,
                    createdAt: true,
                },
            },
            customerInteractions: {
                orderBy: { createdAt: "desc" },
                take: 20,
                include: {
                    staff: { select: { id: true, name: true } },
                },
            },
            _count: {
                select: { orders: true },
            },
        },
    })

    if (!customer) {
        notFound()
    }

    // Calculate total spent
    const totalSpentResult = await prisma.order.aggregate({
        where: { userId: id, paymentStatus: "PAID" },
        _sum: { total: true },
    })
    const totalSpent = totalSpentResult._sum.total || 0

    const shippingAddress = customer.profile?.defaultShippingAddress as Record<string, string> | null

    // Serialize interactions for client component
    const serializedInteractions: CustomerInteraction[] = customer.customerInteractions.map((i) => ({
        id: i.id,
        type: i.type as InteractionType,
        subject: i.subject,
        description: i.description,
        metadata: i.metadata as Record<string, unknown> | null,
        createdAt: i.createdAt.toISOString(),
        staff: i.staff,
    }))

    const measurementFields = [
        { key: "chest", label: "Chest" },
        { key: "shoulder", label: "Shoulder" },
        { key: "sleeveLength", label: "Sleeve Length" },
        { key: "neck", label: "Neck" },
        { key: "backLength", label: "Back Length" },
        { key: "waist", label: "Waist" },
        { key: "hip", label: "Hip" },
        { key: "inseam", label: "Inseam" },
        { key: "outseam", label: "Outseam" },
        { key: "thigh", label: "Thigh" },
        { key: "height", label: "Height" },
        { key: "weight", label: "Weight" },
    ] as const

    const ORDER_STATUS_COLORS: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
        PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
        SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
        DELIVERED: "bg-green-50 text-green-700 border-green-200",
        CANCELLED: "bg-red-50 text-red-700 border-red-200",
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Back link */}
            <Link
                href="/staff/customers"
                className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Customers
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    {customer.name}
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    Customer since {formatDate(customer.createdAt)}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content - orders and interactions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Orders */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-obsidian-400" />
                            <h2 className="text-base font-semibold text-obsidian-900">
                                Recent Orders ({customer._count.orders})
                            </h2>
                        </div>
                        {customer.orders.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <p className="text-sm text-obsidian-400">No orders placed yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-obsidian-100">
                                {customer.orders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/staff/orders/${order.id}`}
                                        className="flex items-center justify-between px-5 py-3.5 hover:bg-obsidian-50/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-obsidian-900 font-tabular">
                                                #{order.orderNumber}
                                            </p>
                                            <p className="text-xs text-obsidian-500 mt-0.5">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-sm font-medium font-tabular text-obsidian-900">
                                                {formatCurrency(order.total)}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                                ORDER_STATUS_COLORS[order.status] || "bg-obsidian-50 text-obsidian-700 border-obsidian-200"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interactions */}
                    <div className="bg-white rounded-sm border border-obsidian-200 p-5">
                        <StaffCustomerInteractions
                            customerId={customer.id}
                            interactions={serializedInteractions}
                        />
                    </div>
                </div>

                {/* Right column - Customer info */}
                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100">
                            <h2 className="text-base font-semibold text-obsidian-900">Contact Info</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-obsidian-400" />
                                <span className="text-sm font-medium text-obsidian-900">{customer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-obsidian-400" />
                                <span className="text-sm text-obsidian-600">{customer.email}</span>
                            </div>
                            {customer.profile?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-obsidian-400" />
                                    <span className="text-sm text-obsidian-600">{customer.profile.phone}</span>
                                </div>
                            )}
                            {customer.lastLoginAt && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-obsidian-400" />
                                    <span className="text-xs text-obsidian-500">
                                        Last login: {formatDate(customer.lastLoginAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100">
                            <h2 className="text-base font-semibold text-obsidian-900">Summary</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Total Orders</span>
                                <span className="font-tabular font-medium text-obsidian-900">
                                    {customer._count.orders}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Total Spent</span>
                                <span className="font-tabular font-medium text-obsidian-900">
                                    {formatCurrency(totalSpent)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {shippingAddress && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-obsidian-400" />
                                <h2 className="text-base font-semibold text-obsidian-900">Default Address</h2>
                            </div>
                            <div className="px-5 py-4 text-sm text-obsidian-600 space-y-1">
                                {shippingAddress.address && <p>{shippingAddress.address}</p>}
                                {(shippingAddress.city || shippingAddress.state) && (
                                    <p>
                                        {shippingAddress.city}{shippingAddress.city && shippingAddress.state ? ", " : ""}{shippingAddress.state}
                                    </p>
                                )}
                                {shippingAddress.zip && <p>{shippingAddress.zip}</p>}
                            </div>
                        </div>
                    )}

                    {/* Measurements (read-only) */}
                    {customer.measurements.length > 0 && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-obsidian-400" />
                                <h2 className="text-base font-semibold text-obsidian-900">
                                    Measurements ({customer.measurements.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-obsidian-100">
                                {customer.measurements.map((m) => (
                                    <div key={m.id} className="px-5 py-4">
                                        <p className="text-sm font-medium text-obsidian-900 mb-2">
                                            {m.label}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            {measurementFields.map(({ key, label }) => {
                                                const value = m[key as keyof typeof m]
                                                if (!value || value === 0) return null
                                                return (
                                                    <div key={key} className="flex justify-between text-xs">
                                                        <span className="text-obsidian-500">{label}</span>
                                                        <span className="font-tabular text-obsidian-700">
                                                            {String(value)} cm
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {m.measuredBy && (
                                            <p className="text-xs text-obsidian-400 mt-2">
                                                Measured by: {m.measuredBy}
                                                {m.measuredAt && ` on ${formatDate(m.measuredAt)}`}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Profile Notes */}
                    {customer.profile?.notes && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100">
                                <h2 className="text-base font-semibold text-obsidian-900">Notes</h2>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm text-obsidian-600 whitespace-pre-wrap">
                                    {customer.profile.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
