import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Eye } from "lucide-react"
import OrdersListFilters from "./OrdersListFilters"

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>
}) {
    const params = await searchParams
    const where: any = {}

    // Filter by order number or customer email
    if (params.q) {
        where.OR = [
            { orderNumber: { contains: params.q } },
            { customerEmail: { contains: params.q } },
        ]
    }

    // Filter by status
    if (params.status) {
        where.status = params.status
    }

    const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
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
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-medium text-obsidian-900">Orders</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-obsidian-200 rounded-sm text-sm font-medium hover:bg-obsidian-50">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <OrdersListFilters currentSearch={params.q || ""} currentStatus={params.status || ""} />

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Order ID</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Date</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Items</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Total</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-obsidian-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-obsidian-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-obsidian-900">
                                            #{order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-obsidian-900 font-medium">{order.customerEmail}</span>
                                                {order.user && <span className="text-xs text-obsidian-500">Registered</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {order._count.items} items
                                        </td>
                                        <td className="px-6 py-4 font-medium text-obsidian-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-obsidian-200 text-obsidian-500 hover:text-obsidian-900 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
