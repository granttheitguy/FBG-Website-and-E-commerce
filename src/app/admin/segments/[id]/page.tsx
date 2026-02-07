import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { ChevronLeft, Users } from "lucide-react"

export default async function AdminSegmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const { id } = await params

    const segment = await prisma.customerSegment.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true,
                            profile: { select: { phone: true } },
                            _count: { select: { orders: true } },
                        },
                    },
                },
                orderBy: { addedAt: "desc" },
            },
        },
    })

    if (!segment) {
        notFound()
    }

    // Calculate total spend per member
    const memberIds = segment.members.map((m) => m.user.id)
    const spendData = await prisma.order.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds }, paymentStatus: "PAID" },
        _sum: { total: true },
    })
    const spendMap = new Map(spendData.map((s) => [s.userId, s._sum.total || 0]))

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link
                    href="/admin/segments"
                    className="p-2 hover:bg-obsidian-100 rounded-sm transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Back to segments"
                >
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: segment.color }}
                            aria-hidden="true"
                        />
                        <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                            {segment.name}
                        </h1>
                        {segment.isAutomatic && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 font-medium border border-blue-200">
                                Auto
                            </span>
                        )}
                    </div>
                    {segment.description && (
                        <p className="text-sm text-obsidian-500 mt-1 ml-6">
                            {segment.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Members Count */}
            <div className="mb-6">
                <p className="text-sm text-obsidian-600">
                    <span className="font-medium font-tabular">{segment.members.length}</span>{" "}
                    member{segment.members.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                {segment.members.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-10 h-10 text-obsidian-300 mx-auto mb-3" />
                        <p className="text-sm text-obsidian-500">No members in this segment yet.</p>
                        <p className="text-xs text-obsidian-400 mt-1">
                            Add customers from their profile page.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden sm:table-cell">Phone</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Orders</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden md:table-cell">Total Spent</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {segment.members.map((member) => {
                                    const spent = spendMap.get(member.user.id) || 0
                                    return (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-obsidian-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/admin/customers/${member.user.id}`}
                                                    className="group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-obsidian-100 flex items-center justify-center text-obsidian-500 font-medium text-xs flex-shrink-0">
                                                            {member.user.name[0]?.toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-obsidian-900 group-hover:text-gold-600 transition-colors truncate">
                                                                {member.user.name}
                                                            </p>
                                                            <p className="text-xs text-obsidian-500 truncate">
                                                                {member.user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 hidden sm:table-cell">
                                                {member.user.profile?.phone || (
                                                    <span className="text-obsidian-300">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-tabular text-obsidian-600">
                                                {member.user._count.orders}
                                            </td>
                                            <td className="px-6 py-4 text-right font-tabular font-medium text-obsidian-900 hidden md:table-cell">
                                                {formatCurrency(spent)}
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap hidden lg:table-cell">
                                                {formatDate(member.addedAt)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
