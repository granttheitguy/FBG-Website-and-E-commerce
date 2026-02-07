import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Package, ChevronRight, Clock } from "lucide-react"

export default async function CustomerOrdersPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const orders = await prisma.order.findMany({
        where: {
            OR: [
                { userId: session.user.id },
                { customerEmail: session.user.email }
            ]
        },
        orderBy: { createdAt: "desc" },
        include: {
            items: {
                take: 1,
                include: { product: { include: { images: true } } }
            },
            _count: { select: { items: true } }
        }
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800"
            case "PROCESSING": return "bg-blue-100 text-blue-800"
            case "SHIPPED": return "bg-purple-100 text-purple-800"
            case "DELIVERED": return "bg-green-100 text-green-800"
            case "CANCELLED": return "bg-red-100 text-red-800"
            default: return "bg-obsidian-100 text-obsidian-800"
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-medium text-obsidian-900 mb-8 font-serif">My Orders</h1>

            <div className="space-y-6">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-obsidian-50 rounded-sm border border-obsidian-100">
                        <Package className="w-12 h-12 text-obsidian-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-obsidian-900">No orders yet</h3>
                        <p className="text-obsidian-500 mb-6">You haven't placed any orders yet.</p>
                        <Link href="/shop" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white border border-obsidian-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="px-6 py-4 bg-obsidian-50 border-b border-obsidian-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-xs text-obsidian-500 uppercase tracking-wider">Order Placed</p>
                                        <p className="text-sm font-medium text-obsidian-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-obsidian-500 uppercase tracking-wider">Total</p>
                                        <p className="text-sm font-medium text-obsidian-900">{formatCurrency(order.total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-obsidian-500 uppercase tracking-wider">Order #</p>
                                        <p className="text-sm font-medium text-obsidian-900">{order.orderNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <Link
                                        href={`/account/orders/${order.id}`}
                                        className="text-sm font-medium text-obsidian-900 hover:text-obsidian-600 flex items-center gap-1"
                                    >
                                        View Details <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-24 bg-obsidian-100 rounded overflow-hidden flex-shrink-0">
                                        {order.items[0]?.product.images[0] && (
                                            <img
                                                src={order.items[0].product.images[0].imageUrl}
                                                alt={order.items[0].product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-obsidian-900">{order.items[0]?.product.name}</h3>
                                        <p className="text-sm text-obsidian-500 mt-1">
                                            {order._count.items > 1 ? `+ ${order._count.items - 1} more items` : `Qty: ${order.items[0]?.quantity}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-obsidian-500 flex items-center gap-1 justify-end">
                                            <Clock className="w-4 h-4" />
                                            Updated {new Date(order.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
