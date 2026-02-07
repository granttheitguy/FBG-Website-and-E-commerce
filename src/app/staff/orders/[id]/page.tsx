import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Package, MapPin, CreditCard, Clock } from "lucide-react"

const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
    SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    REFUNDED: "bg-obsidian-50 text-obsidian-700 border-obsidian-200",
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    UNPAID: "bg-red-50 text-red-700 border-red-200",
    PAID: "bg-green-50 text-green-700 border-green-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    REFUNDED: "bg-obsidian-50 text-obsidian-700 border-obsidian-200",
}

export default async function StaffOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
                include: {
                    product: {
                        select: { name: true, slug: true },
                    },
                    productVariant: {
                        select: { size: true, color: true, sku: true },
                    },
                },
            },
            statusLogs: {
                orderBy: { createdAt: "desc" },
                include: {
                    changedBy: { select: { name: true } },
                },
            },
        },
    })

    if (!order) {
        notFound()
    }

    const shippingAddress = order.shippingAddress as Record<string, string> | null

    return (
        <div className="p-6 lg:p-8">
            {/* Back link */}
            <Link
                href="/staff/orders"
                className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Orders
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Order #{order.orderNumber}
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Placed on {formatDate(order.placedAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-sm text-xs font-medium border ${
                        ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.PENDING
                    }`}>
                        {order.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-sm text-xs font-medium border ${
                        PAYMENT_STATUS_COLORS[order.paymentStatus] || PAYMENT_STATUS_COLORS.UNPAID
                    }`}>
                        {order.paymentStatus}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items - takes 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                            <Package className="w-4 h-4 text-obsidian-400" />
                            <h2 className="text-base font-semibold text-obsidian-900">
                                Order Items ({order.items.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-obsidian-100">
                            {order.items.map((item) => (
                                <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-obsidian-900 truncate">
                                            {item.nameSnapshot}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-obsidian-500">
                                            <span>SKU: {item.skuSnapshot}</span>
                                            {item.productVariant.size && (
                                                <span>Size: {item.productVariant.size}</span>
                                            )}
                                            {item.productVariant.color && (
                                                <span>Color: {item.productVariant.color}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-medium font-tabular text-obsidian-900">
                                            {formatCurrency(item.totalPrice)}
                                        </p>
                                        <p className="text-xs text-obsidian-500 mt-0.5">
                                            {item.quantity} x {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Totals */}
                        <div className="border-t border-obsidian-200 px-5 py-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Subtotal</span>
                                <span className="font-tabular text-obsidian-900">{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Shipping</span>
                                <span className="font-tabular text-obsidian-900">{formatCurrency(order.shippingCost)}</span>
                            </div>
                            {order.discountTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-obsidian-500">
                                        Discount
                                        {order.couponCode && (
                                            <span className="ml-1 text-xs text-emerald-600">({order.couponCode})</span>
                                        )}
                                    </span>
                                    <span className="font-tabular text-red-600">-{formatCurrency(order.discountTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-obsidian-100">
                                <span className="text-obsidian-900">Total</span>
                                <span className="font-tabular text-obsidian-900">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status History */}
                    {order.statusLogs.length > 0 && (
                        <div className="bg-white rounded-sm border border-obsidian-200">
                            <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-obsidian-400" />
                                <h2 className="text-base font-semibold text-obsidian-900">Status History</h2>
                            </div>
                            <ul className="divide-y divide-obsidian-100">
                                {order.statusLogs.map((log) => (
                                    <li key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-obsidian-900">
                                                <span className="font-medium">{log.oldStatus}</span>
                                                {" "}
                                                <span className="text-obsidian-400">-&gt;</span>
                                                {" "}
                                                <span className="font-medium">{log.newStatus}</span>
                                            </p>
                                            {log.note && (
                                                <p className="text-xs text-obsidian-500 mt-0.5">{log.note}</p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-obsidian-500">{log.changedBy.name}</p>
                                            <p className="text-xs text-obsidian-400">{formatDate(log.createdAt)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right column - Customer & Shipping */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100">
                            <h2 className="text-base font-semibold text-obsidian-900">Customer</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            {order.user ? (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-obsidian-900">{order.user.name}</p>
                                        <p className="text-xs text-obsidian-500">{order.user.email}</p>
                                    </div>
                                    <Link
                                        href={`/staff/customers/${order.user.id}`}
                                        className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                    >
                                        View customer profile
                                    </Link>
                                </>
                            ) : (
                                <div>
                                    <p className="text-sm font-medium text-obsidian-900">Guest Order</p>
                                    {order.customerEmail && (
                                        <p className="text-xs text-obsidian-500">{order.customerEmail}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-obsidian-400" />
                            <h2 className="text-base font-semibold text-obsidian-900">Shipping Address</h2>
                        </div>
                        <div className="px-5 py-4">
                            {shippingAddress ? (
                                <div className="text-sm text-obsidian-600 space-y-1">
                                    {shippingAddress.firstName && shippingAddress.lastName && (
                                        <p className="font-medium text-obsidian-900">
                                            {shippingAddress.firstName} {shippingAddress.lastName}
                                        </p>
                                    )}
                                    {shippingAddress.address && <p>{shippingAddress.address}</p>}
                                    {(shippingAddress.city || shippingAddress.state) && (
                                        <p>
                                            {shippingAddress.city}{shippingAddress.city && shippingAddress.state ? ", " : ""}{shippingAddress.state}
                                        </p>
                                    )}
                                    {shippingAddress.zip && <p>{shippingAddress.zip}</p>}
                                    {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                                </div>
                            ) : (
                                <p className="text-sm text-obsidian-400">No shipping address provided</p>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200">
                        <div className="px-5 py-4 border-b border-obsidian-100 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-obsidian-400" />
                            <h2 className="text-base font-semibold text-obsidian-900">Payment</h2>
                        </div>
                        <div className="px-5 py-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Status</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                    PAYMENT_STATUS_COLORS[order.paymentStatus] || PAYMENT_STATUS_COLORS.UNPAID
                                }`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-500">Currency</span>
                                <span className="text-obsidian-900">{order.currency}</span>
                            </div>
                            {order.trackingNumber && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-obsidian-500">Tracking</span>
                                    <span className="text-obsidian-900 font-tabular">{order.trackingNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
