import { prisma } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Users, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"

export default async function StaffCustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>
}) {
    const params = await searchParams
    const search = params.search || ""
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

    const [customers, total] = await Promise.all([
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
                profile: {
                    select: { phone: true },
                },
                _count: {
                    select: { orders: true },
                },
                orders: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { createdAt: true },
                },
            },
        }),
        prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    Customers
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    Search and view customer information
                </p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <form method="GET" className="flex gap-2">
                    <input
                        name="search"
                        type="text"
                        defaultValue={search}
                        placeholder="Search by name, email, or phone..."
                        className="flex-1 h-10 rounded-sm border border-obsidian-200 bg-white px-4 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-4 h-10 rounded-sm bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                        aria-label="Search customers"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Table */}
            {customers.length === 0 ? (
                <EmptyState
                    icon={<Users className="w-8 h-8" />}
                    title={search ? "No customers found" : "No customers yet"}
                    description={search ? "Try adjusting your search terms." : "Customer accounts will appear here once they register."}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Email</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Phone</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Orders</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden lg:table-cell">Last Order</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-obsidian-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/staff/customers/${customer.id}`}
                                                className="font-medium text-obsidian-900 hover:text-emerald-600 transition-colors"
                                            >
                                                {customer.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 truncate max-w-[200px]">
                                            {customer.email}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden md:table-cell">
                                            {customer.profile?.phone || (
                                                <span className="text-obsidian-300">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-tabular text-obsidian-700 hidden lg:table-cell">
                                            {customer._count.orders}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 hidden lg:table-cell whitespace-nowrap">
                                            {customer.orders[0] ? (
                                                formatDate(customer.orders[0].createdAt)
                                            ) : (
                                                <span className="text-obsidian-300">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/staff/customers/${customer.id}`}
                                                className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-sm hover:bg-obsidian-100 text-obsidian-500 hover:text-obsidian-900 transition-colors"
                                                aria-label={`View customer ${customer.name}`}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
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
                                        href={`/staff/customers?${buildParams({ search, page: String(page - 1) })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
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
                                        href={`/staff/customers?${buildParams({ search, page: String(page + 1) })}`}
                                        className="p-2 rounded-sm border border-obsidian-200 hover:bg-obsidian-50 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
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
