import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ChevronLeft, Package, MapPin, CreditCard, RotateCcw } from "lucide-react"
import { ReturnRequestForm } from "@/components/features/account/ReturnRequestForm"

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"

function getReturnStatusBadgeClasses(status: ReturnStatus): string {
    switch (status) {
        case "PENDING":
            return "bg-yellow-100 text-yellow-800"
        case "APPROVED":
            return "bg-blue-100 text-blue-800"
        case "REJECTED":
            return "bg-red-100 text-red-800"
        case "COMPLETED":
            return "bg-green-100 text-green-800"
        default:
            return "bg-obsidian-100 text-obsidian-800"
    }
}

function getReturnStatusMessage(status: ReturnStatus): string {
    switch (status) {
        case "PENDING":
            return "Your return request is being reviewed by our team. We will get back to you shortly."
        case "APPROVED":
            return "Your return request has been approved. Please follow the return instructions sent to your email."
        case "REJECTED":
            return "Your return request was not approved. Please contact support if you have questions."
        case "COMPLETED":
            return "Your return has been processed and the refund has been initiated."
        default:
            return ""
    }
}

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: { include: { images: true } }
                }
            },
            statusLogs: {
                orderBy: { createdAt: "desc" }
            },
            returnRequests: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        }
    })

    // Security check: Ensure order belongs to user
    if (!order || (order.userId !== session.user.id && order.customerEmail !== session.user.email)) {
        notFound()
    }

    const shippingAddress = order.shippingAddress as Record<string, string> | null
    const existingReturn = order.returnRequests[0] ?? null
    const canRequestReturn = order.status === "DELIVERED" && !existingReturn

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link href="/account/orders" className="text-sm text-obsidian-500 hover:text-obsidian-900 flex items-center gap-1 mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back to Orders
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-medium text-obsidian-900 font-serif">Order #{order.orderNumber}</h1>
                        <p className="text-obsidian-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-obsidian-200 rounded-sm text-sm font-medium hover:bg-obsidian-50 min-h-[48px]">
                            Invoice
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Order Status */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                        <h2 className="font-medium text-obsidian-900 mb-4">Order Status</h2>
                        <div className="relative pl-4 border-l-2 border-obsidian-100 ml-2 space-y-6">
                            {order.statusLogs.map((log) => (
                                <div key={log.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-obsidian-300 border-2 border-white ring-1 ring-obsidian-100"></div>
                                    <p className="text-sm font-medium text-obsidian-900 capitalize">{log.newStatus.toLowerCase()}</p>
                                    <p className="text-xs text-obsidian-500 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-obsidian-900 border-2 border-white ring-1 ring-obsidian-100"></div>
                                <p className="text-sm font-medium text-obsidian-900">Order Placed</p>
                                <p className="text-xs text-obsidian-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white border border-obsidian-200 rounded-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-obsidian-100">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-obsidian-400" />
                                Items
                            </h2>
                        </div>
                        <div className="divide-y divide-obsidian-100">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-6 flex gap-4">
                                    <div className="w-20 h-24 bg-obsidian-100 rounded overflow-hidden flex-shrink-0">
                                        {item.product.images[0] && (
                                            <img src={item.product.images[0].imageUrl} alt={item.nameSnapshot} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-obsidian-900">{item.nameSnapshot}</h3>
                                                <p className="text-sm text-obsidian-500 mt-1">Size: {item.skuSnapshot}</p>
                                            </div>
                                            <p className="font-medium text-obsidian-900">{formatCurrency(item.totalPrice)}</p>
                                        </div>
                                        <p className="text-sm text-obsidian-500 mt-2">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Return Request Section */}
                    {existingReturn && (
                        <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                                <RotateCcw className="w-4 h-4 text-obsidian-400" />
                                Return Request
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-obsidian-600">Status</span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReturnStatusBadgeClasses(
                                            existingReturn.status as ReturnStatus
                                        )}`}
                                    >
                                        {existingReturn.status}
                                    </span>
                                </div>
                                <p className="text-sm text-obsidian-600">
                                    {getReturnStatusMessage(existingReturn.status as ReturnStatus)}
                                </p>
                                <div className="border-t border-obsidian-100 pt-4">
                                    <p className="text-xs text-obsidian-500 mb-1">Your reason</p>
                                    <p className="text-sm text-obsidian-700">{existingReturn.reason}</p>
                                </div>
                                <div className="flex gap-6 text-xs text-obsidian-500">
                                    <span>Submitted: {formatDate(existingReturn.createdAt)}</span>
                                    {existingReturn.refundAmount != null && (
                                        <span>
                                            Refund: {formatCurrency(existingReturn.refundAmount)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {canRequestReturn && (
                        <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                                <RotateCcw className="w-4 h-4 text-obsidian-400" />
                                Request a Return
                            </h2>
                            <p className="text-sm text-obsidian-600 mb-4">
                                Not satisfied with your order? You can request a return below.
                            </p>
                            <ReturnRequestForm
                                orderId={order.id}
                                orderNumber={order.orderNumber}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Shipping Address */}
                    {shippingAddress && (
                        <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-obsidian-400" />
                                Shipping Address
                            </h2>
                            <address className="not-italic text-sm text-obsidian-600 space-y-1">
                                <p className="font-medium text-obsidian-900">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                                <p>{shippingAddress.address}</p>
                                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                                <p className="mt-2">{shippingAddress.phone}</p>
                            </address>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <CreditCard className="w-4 h-4 text-obsidian-400" />
                            Summary
                        </h2>
                        <div className="space-y-3 text-sm border-b border-obsidian-100 pb-4 mb-4">
                            <div className="flex justify-between">
                                <span className="text-obsidian-600">Subtotal</span>
                                <span className="font-medium text-obsidian-900">{formatCurrency(order.subtotal || order.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-obsidian-600">Shipping</span>
                                <span className="font-medium text-obsidian-900">{formatCurrency(order.shippingCost)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-base font-medium">
                            <span className="text-obsidian-900">Total</span>
                            <span className="text-obsidian-900">{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
