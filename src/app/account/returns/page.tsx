import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Package, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import EmptyState from "@/components/ui/EmptyState"

const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    REFUNDED: "bg-green-100 text-green-800 border-green-200"
}

export default async function ReturnsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const returnRequests = await prisma.returnRequest.findMany({
        where: { userId: session.user.id },
        include: {
            order: {
                select: {
                    orderNumber: true,
                    total: true,
                    placedAt: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return (
        <div className="bg-white border border-obsidian-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-obsidian-100 bg-obsidian-50">
                <h1 className="text-lg font-medium text-obsidian-900">Return Requests</h1>
                <p className="text-sm text-obsidian-500">View and track your return requests.</p>
            </div>

            <div className="p-6">
                {returnRequests.length === 0 ? (
                    <EmptyState
                        icon={<Package className="w-8 h-8" />}
                        title="No return requests"
                        description="You haven't requested any returns yet. Returns can be requested from your order details page."
                        action={{
                            label: "View Orders",
                            href: "/account/orders"
                        }}
                    />
                ) : (
                    <div className="space-y-4">
                        {returnRequests.map((returnRequest) => (
                            <div
                                key={returnRequest.id}
                                className="border border-obsidian-200 rounded-sm p-6 hover:border-gold-500 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Link
                                                href={`/account/orders/${returnRequest.orderId}`}
                                                className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors"
                                            >
                                                Order #{returnRequest.order.orderNumber}
                                            </Link>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium border ${
                                                    statusColors[returnRequest.status as keyof typeof statusColors]
                                                }`}
                                            >
                                                {returnRequest.status}
                                            </span>
                                        </div>

                                        <div className="text-sm text-obsidian-600 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Requested on {formatDate(returnRequest.createdAt.toISOString())}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                <span>Order Total: {formatCurrency(returnRequest.order.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {returnRequest.refundAmount && (
                                        <div className="text-right">
                                            <p className="text-sm text-obsidian-500">Refund Amount</p>
                                            <p className="text-lg font-bold text-green-600 font-tabular">
                                                {formatCurrency(returnRequest.refundAmount)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-obsidian-100 pt-4">
                                    <p className="text-sm font-medium text-obsidian-700 mb-2">Reason for Return:</p>
                                    <p className="text-sm text-obsidian-600">{returnRequest.reason}</p>
                                </div>

                                {returnRequest.adminNotes && (
                                    <div className="mt-4 bg-obsidian-50 border border-obsidian-200 rounded-sm p-4">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-obsidian-700 mb-1">Admin Response:</p>
                                                <p className="text-sm text-obsidian-600">{returnRequest.adminNotes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
