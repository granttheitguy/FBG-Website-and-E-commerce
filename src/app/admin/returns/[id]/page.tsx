import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
    ChevronLeft,
    Package,
    User,
    RotateCcw,
    FileText,
} from "lucide-react"
import { ProcessReturnForm } from "./ProcessReturnForm"

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"

function getStatusBadgeClasses(status: ReturnStatus): string {
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

export default async function AdminReturnDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()

    if (
        !session?.user ||
        !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
        redirect("/admin/login")
    }

    const { id } = await params

    const returnRequest = await prisma.returnRequest.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    items: {
                        include: {
                            product: {
                                include: { images: true },
                            },
                        },
                    },
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                },
            },
        },
    })

    if (!returnRequest) {
        notFound()
    }

    return (
        <div className="p-8">
            {/* Back link and header */}
            <div className="mb-8">
                <Link
                    href="/admin/returns"
                    className="text-sm text-obsidian-500 hover:text-obsidian-900 flex items-center gap-1 mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Returns
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                            Return Request
                        </h1>
                        <p className="text-obsidian-500 mt-1 text-sm">
                            Order #{returnRequest.order.orderNumber} &middot;
                            Submitted {formatDate(returnRequest.createdAt)}
                        </p>
                    </div>
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(
                            returnRequest.status as ReturnStatus
                        )}`}
                    >
                        {returnRequest.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Return Reason */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <RotateCcw className="w-4 h-4 text-obsidian-400" />
                            Return Reason
                        </h2>
                        <p className="text-obsidian-700 whitespace-pre-wrap leading-relaxed">
                            {returnRequest.reason}
                        </p>
                    </div>

                    {/* Admin Notes (if any) */}
                    {returnRequest.adminNotes && (
                        <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                                <FileText className="w-4 h-4 text-obsidian-400" />
                                Admin Notes
                            </h2>
                            <p className="text-obsidian-700 whitespace-pre-wrap leading-relaxed">
                                {returnRequest.adminNotes}
                            </p>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white border border-obsidian-200 rounded-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-obsidian-100">
                            <h2 className="font-medium text-obsidian-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-obsidian-400" />
                                Order Items
                            </h2>
                        </div>
                        <div className="divide-y divide-obsidian-100">
                            {returnRequest.order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-6 flex gap-4"
                                >
                                    <div className="w-16 h-20 bg-obsidian-100 rounded-sm overflow-hidden flex-shrink-0">
                                        {item.product.images[0] && (
                                            <img
                                                src={
                                                    item.product.images[0]
                                                        .imageUrl
                                                }
                                                alt={item.nameSnapshot}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-obsidian-900 truncate">
                                                    {item.nameSnapshot}
                                                </h3>
                                                <p className="text-sm text-obsidian-500 mt-0.5">
                                                    SKU: {item.skuSnapshot}
                                                </p>
                                                <p className="text-sm text-obsidian-500">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium text-obsidian-900 font-tabular flex-shrink-0">
                                                {formatCurrency(
                                                    item.totalPrice
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Order totals */}
                        <div className="px-6 py-4 border-t border-obsidian-200 bg-obsidian-50">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-obsidian-900">
                                    Order Total
                                </span>
                                <span className="font-medium text-obsidian-900 font-tabular">
                                    {formatCurrency(
                                        returnRequest.order.total
                                    )}
                                </span>
                            </div>
                            {returnRequest.refundAmount != null && (
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-obsidian-600">
                                        Refund Amount
                                    </span>
                                    <span className="text-sm font-medium text-green-700 font-tabular">
                                        {formatCurrency(
                                            returnRequest.refundAmount
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: customer info + process form */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-obsidian-400" />
                            Customer
                        </h2>
                        <div className="space-y-2 text-sm">
                            <p className="font-medium text-obsidian-900">
                                {returnRequest.user.name}
                            </p>
                            <p className="text-obsidian-600">
                                {returnRequest.user.email}
                            </p>
                            <p className="text-obsidian-500 text-xs mt-2">
                                Member since{" "}
                                {formatDate(returnRequest.user.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Process Return Form */}
                    <div className="bg-white border border-obsidian-200 rounded-sm p-6">
                        <h2 className="font-medium text-obsidian-900 mb-4">
                            Process Return
                        </h2>
                        <ProcessReturnForm
                            returnId={returnRequest.id}
                            currentStatus={returnRequest.status}
                            orderTotal={returnRequest.order.total}
                            currentRefundAmount={
                                returnRequest.refundAmount
                            }
                            currentAdminNotes={
                                returnRequest.adminNotes
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
