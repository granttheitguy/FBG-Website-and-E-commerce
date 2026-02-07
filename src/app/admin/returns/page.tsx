import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Eye, RotateCcw } from "lucide-react"

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"

const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Completed", value: "COMPLETED" },
] as const

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

export default async function AdminReturnsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const { status: statusFilter } = await searchParams

    const where: Record<string, unknown> = {}
    if (
        statusFilter &&
        ["PENDING", "APPROVED", "REJECTED", "COMPLETED"].includes(statusFilter)
    ) {
        where.status = statusFilter
    }

    const returns = await prisma.returnRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    status: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    })

    // Counts for badge numbers on tabs
    const allCounts = await prisma.returnRequest.groupBy({
        by: ["status"],
        _count: { status: true },
    })

    const countMap: Record<string, number> = {}
    let totalCount = 0
    for (const item of allCounts) {
        countMap[item.status] = item._count.status
        totalCount += item._count.status
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Returns & Refunds
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Manage customer return requests and process refunds.
                    </p>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1 mb-6 border-b border-obsidian-200">
                {STATUS_TABS.map((tab) => {
                    const isActive = (statusFilter || "") === tab.value
                    const count =
                        tab.value === ""
                            ? totalCount
                            : countMap[tab.value] ?? 0

                    return (
                        <Link
                            key={tab.value}
                            href={
                                tab.value
                                    ? `/admin/returns?status=${tab.value}`
                                    : "/admin/returns"
                            }
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2 ${
                                isActive
                                    ? "border-obsidian-900 text-obsidian-900"
                                    : "border-transparent text-obsidian-500 hover:text-obsidian-700 hover:border-obsidian-300"
                            }`}
                        >
                            {tab.label}
                            <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    isActive
                                        ? "bg-obsidian-900 text-white"
                                        : "bg-obsidian-100 text-obsidian-600"
                                }`}
                            >
                                {count}
                            </span>
                        </Link>
                    )
                })}
            </div>

            {/* Returns Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Order #
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Customer
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Reason
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Order Total
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Refund
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Status
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">
                                    Date
                                </th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {returns.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <RotateCcw className="w-8 h-8 text-obsidian-300" />
                                            <p className="text-obsidian-500">
                                                No return requests found.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((returnReq) => (
                                    <tr
                                        key={returnReq.id}
                                        className="hover:bg-obsidian-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-obsidian-900">
                                            #{returnReq.order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-obsidian-900 font-medium">
                                                    {returnReq.user.name}
                                                </span>
                                                <span className="text-xs text-obsidian-500">
                                                    {returnReq.user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 max-w-[200px]">
                                            <p className="truncate">
                                                {returnReq.reason}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-obsidian-900 font-tabular">
                                            {formatCurrency(
                                                returnReq.order.total
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-tabular">
                                            {returnReq.refundAmount != null ? (
                                                <span className="font-medium text-obsidian-900">
                                                    {formatCurrency(
                                                        returnReq.refundAmount
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-obsidian-400">
                                                    --
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                                                    returnReq.status as ReturnStatus
                                                )}`}
                                            >
                                                {returnReq.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {formatDate(returnReq.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/returns/${returnReq.id}`}
                                                className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-sm hover:bg-obsidian-100 text-obsidian-500 hover:text-obsidian-900 transition-colors"
                                                aria-label={`View return request for order ${returnReq.order.orderNumber}`}
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
