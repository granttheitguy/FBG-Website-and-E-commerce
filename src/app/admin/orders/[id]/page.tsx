import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { ChevronLeft, Package, Truck, CreditCard, User, MapPin, Calendar, Clock } from "lucide-react"
import OrderStatusSelect from "@/components/features/admin/OrderStatusSelect"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: { include: { images: true } }
                }
            },
            user: true,
            statusLogs: {
                orderBy: { createdAt: "desc" },
                include: { changedBy: true }
            }
        }
    })

    if (!order) {
        notFound()
    }

    const shippingAddress = order.shippingAddress as Record<string, string> | null

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/orders" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-medium text-obsidian-900">Order #{order.orderNumber}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-obsidian-100 text-obsidian-800 border border-obsidian-200">
                            {new Date(order.createdAt).toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Items */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-obsidian-100 flex items-center justify-between">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-obsidian-400" />
                                Order Items
                            </h2>
                            <span className="text-sm text-obsidian-500">{order.items.length} items</span>
                        </div>
                        <div className="divide-y divide-obsidian-100">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-6 flex gap-4">
                                    <div className="w-16 h-20 bg-obsidian-100 rounded overflow-hidden flex-shrink-0">
                                        {item.product.images[0] && (
                                            <img src={item.product.images[0].imageUrl} alt={item.nameSnapshot} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-sm font-medium text-obsidian-900">{item.nameSnapshot}</h3>
                                                <p className="text-xs text-obsidian-500 mt-1">Size: {item.skuSnapshot}</p>
                                            </div>
                                            <p className="text-sm font-medium text-obsidian-900">{formatCurrency(item.totalPrice)}</p>
                                        </div>
                                        <p className="text-xs text-obsidian-500 mt-2">
                                            {item.quantity} x {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-obsidian-50 px-6 py-4 border-t border-obsidian-100">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-obsidian-600">Subtotal</span>
                                <span className="font-medium text-obsidian-900">{formatCurrency(order.subtotal || order.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-obsidian-600">Shipping</span>
                                <span className="font-medium text-obsidian-900">{formatCurrency(order.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between text-base font-medium pt-2 border-t border-obsidian-200 mt-2">
                                <span className="text-obsidian-900">Total</span>
                                <span className="text-obsidian-900">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-6">
                            <Clock className="w-4 h-4 text-obsidian-400" />
                            Order Timeline
                        </h2>
                        <div className="space-y-6 relative pl-4 border-l-2 border-obsidian-100 ml-2">
                            {order.statusLogs.map((log) => (
                                <div key={log.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-obsidian-300 border-2 border-white ring-1 ring-obsidian-100"></div>
                                    <p className="text-sm font-medium text-obsidian-900">
                                        Status changed to <span className="uppercase">{log.newStatus}</span>
                                    </p>
                                    <p className="text-xs text-obsidian-500 mt-0.5">
                                        by {log.changedBy.name} · {new Date(log.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-obsidian-900 border-2 border-white ring-1 ring-obsidian-100"></div>
                                <p className="text-sm font-medium text-obsidian-900">Order Placed</p>
                                <p className="text-xs text-obsidian-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Customer */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-obsidian-400" />
                            Customer
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-obsidian-500 text-xs">Email</p>
                                <p className="font-medium text-obsidian-900 truncate">{order.customerEmail}</p>
                            </div>
                            {order.user && (
                                <div>
                                    <p className="text-obsidian-500 text-xs">Account</p>
                                    <Link href={`/admin/users/${order.user.id}`} className="text-blue-600 hover:underline">View Profile</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {shippingAddress && (
                        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
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

                    {/* Payment (Placeholder) */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <CreditCard className="w-4 h-4 text-obsidian-400" />
                            Payment
                        </h2>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-obsidian-600">Status</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {order.paymentStatus}
                            </span>
                        </div>
                        <p className="text-xs text-obsidian-400">Payment integration pending</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
