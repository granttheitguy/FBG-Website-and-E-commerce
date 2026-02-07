import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react"
import CustomerListFilters from "./CustomerListFilters"

export default async function AdminCustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; segment?: string; tag?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams
    const search = params.search || ""
    const segmentFilter = params.segment || ""
    const tagFilter = params.tag || ""
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
        role: "CUSTOMER",
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { profile: { phone: { contains: search } } },
        ]
    }

    if (segmentFilter) {
        where.segmentMemberships = { some: { segmentId: segmentFilter } }
    }

    if (tagFilter) {
        where.tagAssignments = { some: { tagId: tagFilter } }
    }

    const [customers, total, segments, tags] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                profile: { select: { phone: true } },
                _count: { select: { orders: true } },
                orders: {
                    select: { total: true, placedAt: true },
                    orderBy: { placedAt: "desc" },
                    take: 1,
                },
                segmentMemberships: {
                    select: {
                        segment: { select: { id: true, name: true, color: true } },
                    },
                },
                tagAssignments: {
                    select: {
                        tag: { select: { id: true, name: true, color: true } },
                    },
                },
            },
        }),
        prisma.user.count({ where }),
        prisma.customerSegment.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
        prisma.customerTag.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
    ])

    // Calculate total spend for displayed customers
    const customerIds = customers.map((c) => c.id)
    const spendData = await prisma.order.groupBy({
        by: ["userId"],
        where: { userId: { in: customerIds }, paymentStatus: "PAID" },
        _sum: { total: true },
    })
    const spendMap = new Map(spendData.map((s) => [s.userId, s._sum.total || 0]))

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Customers
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {total} customer{total !== 1 ? "s" : ""} total
                    </p>
                </div>
            </div>

            {/* Filters (client component for interactivity) */}
            <CustomerListFilters
                segments={segments}
                tags={tags}
                currentSearch={search}
                currentSegment={segmentFilter}
                currentTag={tagFilter}
            />

            {/* Customers Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 hidden sm:table-cell">Phone</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Orders</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right hidden md:table-cell">Total Spent</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Segments</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Tags</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 hidden xl:table-cell">Last Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Users className="w-8 h-8 text-obsidian-300 mx-auto mb-3" />
                                        <p className="text-sm text-obsidian-500">No customers found</p>
                                    </td>
                                </tr>
                            )}
                            {customers.map((customer) => {
                                const segments = customer.segmentMemberships.map((m) => m.segment)
                                const tags = customer.tagAssignments.map((a) => a.tag)
                                const spent = spendMap.get(customer.id) || 0
                                const lastOrder = customer.orders[0]?.placedAt || null

                                return (
                                    <tr
                                        key={customer.id}
                                        className="hover:bg-obsidian-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/customers/${customer.id}`}
                                                className="group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-obsidian-100 flex items-center justify-center text-obsidian-500 font-medium text-xs flex-shrink-0">
                                                        {customer.name[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-obsidian-900 group-hover:text-gold-600 transition-colors truncate">
                                                            {customer.name}
                                                        </p>
                                                        <p className="text-xs text-obsidian-500 truncate">
                                                            {customer.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden sm:table-cell">
                                            {customer.profile?.phone || (
                                                <span className="text-obsidian-300">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-tabular text-obsidian-600">
                                            {customer._count.orders}
                                        </td>
                                        <td className="px-6 py-4 text-right font-tabular text-obsidian-900 font-medium hidden md:table-cell">
                                            {formatCurrency(spent)}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {segments.length === 0 && (
                                                    <span className="text-obsidian-300 text-xs">--</span>
                                                )}
                                                {segments.map((seg) => (
                                                    <span
                                                        key={seg.id}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-obsidian-50 text-obsidian-600 border border-obsidian-100"
                                                    >
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: seg.color }}
                                                            aria-hidden="true"
                                                        />
                                                        {seg.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {tags.length === 0 && (
                                                    <span className="text-obsidian-300 text-xs">--</span>
                                                )}
                                                {tags.map((tag) => (
                                                    <span
                                                        key={tag.id}
                                                        className="inline-flex px-1.5 py-0.5 rounded-sm text-[11px] font-medium"
                                                        style={{
                                                            backgroundColor: `${tag.color}20`,
                                                            color: tag.color,
                                                            borderWidth: 1,
                                                            borderColor: `${tag.color}40`,
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden xl:table-cell whitespace-nowrap">
                                            {lastOrder ? formatDate(lastOrder) : (
                                                <span className="text-obsidian-300">No orders</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-obsidian-200 px-6 py-3">
                        <p className="text-sm text-obsidian-500">
                            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/admin/customers?${buildParams({ search, segment: segmentFilter, tag: tagFilter, page: String(page - 1) })}`}
                                    className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            )}
                            <span className="text-sm text-obsidian-700 font-medium px-2">
                                {page} / {totalPages}
                            </span>
                            {page < totalPages && (
                                <Link
                                    href={`/admin/customers?${buildParams({ search, segment: segmentFilter, tag: tagFilter, page: String(page + 1) })}`}
                                    className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function buildParams(params: Record<string, string>): string {
    const sp = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
        if (val) sp.set(key, val)
    }
    return sp.toString()
}
