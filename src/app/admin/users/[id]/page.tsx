import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { ChevronLeft, User, Package, MapPin, Mail, Phone, Calendar } from "lucide-react"

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            profile: true,
            orders: {
                orderBy: { createdAt: "desc" },
                take: 5
            },
            _count: {
                select: { orders: true }
            }
        }
    })

    if (!user) {
        notFound()
    }

    const shippingAddress = user.profile?.defaultShippingAddress
        ? (JSON.parse(user.profile.defaultShippingAddress as string) as { address: string; city: string; state: string; zip: string })
        : null

    const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0)

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/users" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-medium text-obsidian-900">{user.name}</h1>
                        <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="text-xs bg-obsidian-100 hover:bg-obsidian-200 text-obsidian-600 px-2 py-1 rounded border border-obsidian-200 transition-colors"
                        >
                            Edit
                        </Link>
                    </div>
                    <p className="text-sm text-obsidian-500">Customer Profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-obsidian-100 rounded-full flex items-center justify-center text-xl font-medium text-obsidian-600">
                                {user.name[0]}
                            </div>
                            <div>
                                <p className="font-medium text-obsidian-900">{user.name}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-obsidian-100 text-obsidian-800">
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-obsidian-400" />
                                <span className="text-obsidian-600">{user.email}</span>
                            </div>
                            {user.profile?.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-obsidian-400" />
                                    <span className="text-obsidian-600">{user.profile.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-obsidian-400" />
                                <span className="text-obsidian-600">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h3 className="font-medium text-obsidian-900 mb-4">Customer Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-obsidian-50 rounded-sm">
                                <p className="text-xs text-obsidian-500 uppercase tracking-wider">Orders</p>
                                <p className="text-xl font-medium text-obsidian-900 mt-1">{user._count.orders}</p>
                            </div>
                            <div className="p-4 bg-obsidian-50 rounded-sm">
                                <p className="text-xs text-obsidian-500 uppercase tracking-wider">Spent</p>
                                <p className="text-xl font-medium text-obsidian-900 mt-1">{formatCurrency(totalSpent)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    {shippingAddress && (
                        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                            <h3 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-obsidian-400" />
                                Default Address
                            </h3>
                            <address className="not-italic text-sm text-obsidian-600 space-y-1">
                                <p>{shippingAddress.address}</p>
                                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                            </address>
                        </div>
                    )}
                </div>

                {/* Main Content - Orders */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-obsidian-100 flex items-center justify-between">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-obsidian-400" />
                                Recent Orders
                            </h2>
                            <Link href={`/admin/orders?userId=${user.id}`} className="text-sm text-obsidian-600 hover:text-obsidian-900">
                                View All
                            </Link>
                        </div>
                        <div className="divide-y divide-obsidian-100">
                            {user.orders.length === 0 ? (
                                <div className="p-6 text-center text-obsidian-500 text-sm">
                                    No orders found for this user.
                                </div>
                            ) : (
                                user.orders.map((order) => (
                                    <div key={order.id} className="p-6 flex items-center justify-between hover:bg-obsidian-50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-medium text-obsidian-900">#{order.orderNumber}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-obsidian-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-obsidian-900">{formatCurrency(order.total)}</p>
                                            <Link href={`/admin/orders/${order.id}`} className="text-xs text-obsidian-500 hover:text-obsidian-900 mt-1 inline-block">
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
