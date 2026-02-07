import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import {
    MessageCircle,
    Phone,
    Mail,
    MapPin,
    StickyNote,
    ShoppingBag,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import type { InteractionType } from "@/types/crm"

const INTERACTION_ICONS: Record<InteractionType, React.ElementType> = {
    CALL: Phone,
    EMAIL: Mail,
    WHATSAPP: MessageCircle,
    VISIT: MapPin,
    NOTE: StickyNote,
    PURCHASE: ShoppingBag,
    RETURN: RotateCcw,
}

const INTERACTION_LABELS: Record<InteractionType, string> = {
    CALL: "Phone Call",
    EMAIL: "Email",
    WHATSAPP: "WhatsApp",
    VISIT: "Store Visit",
    NOTE: "Note",
    PURCHASE: "Purchase",
    RETURN: "Return",
}

const INTERACTION_COLORS: Record<InteractionType, string> = {
    CALL: "bg-blue-50 text-blue-700 border-blue-200",
    EMAIL: "bg-purple-50 text-purple-700 border-purple-200",
    WHATSAPP: "bg-green-50 text-green-700 border-green-200",
    VISIT: "bg-amber-50 text-amber-700 border-amber-200",
    NOTE: "bg-obsidian-50 text-obsidian-700 border-obsidian-200",
    PURCHASE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    RETURN: "bg-red-50 text-red-700 border-red-200",
}

export default async function StaffInteractionsPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user) {
        redirect("/staff/login")
    }

    const params = await searchParams
    const typeFilter = params.type || "ALL"
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
        staffUserId: session.user.id,
    }

    if (typeFilter !== "ALL") {
        where.type = typeFilter
    }

    const [interactions, total] = await Promise.all([
        prisma.customerInteraction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                customer: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma.customerInteraction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const typeTabs = [
        { value: "ALL", label: "All" },
        { value: "CALL", label: "Calls" },
        { value: "EMAIL", label: "Emails" },
        { value: "WHATSAPP", label: "WhatsApp" },
        { value: "VISIT", label: "Visits" },
        { value: "NOTE", label: "Notes" },
    ]

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    My Interactions
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    {total} interaction{total !== 1 ? "s" : ""} logged by you
                </p>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 overflow-x-auto pb-1">
                {typeTabs.map((tab) => (
                    <Link
                        key={tab.value}
                        href={`/staff/interactions?${buildParams({ type: tab.value === "ALL" ? "" : tab.value })}`}
                        className={`inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                            typeFilter === tab.value
                                ? "bg-emerald-600 text-white"
                                : "bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100"
                        }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Table */}
            {interactions.length === 0 ? (
                <EmptyState
                    icon={<MessageCircle className="w-8 h-8" />}
                    title="No interactions yet"
                    description="Your logged customer interactions will appear here. Visit a customer profile to log an interaction."
                    action={{ label: "Find a Customer", href: "/staff/customers" }}
                />
            ) : (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-obsidian-50 border-b border-obsidian-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Type</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900 hidden md:table-cell">Summary</th>
                                    <th className="px-6 py-4 font-medium text-obsidian-900">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-obsidian-100">
                                {interactions.map((interaction) => {
                                    const type = interaction.type as InteractionType
                                    const Icon = INTERACTION_ICONS[type] || StickyNote
                                    const colorClass = INTERACTION_COLORS[type] || INTERACTION_COLORS.NOTE

                                    return (
                                        <tr key={interaction.id} className="hover:bg-obsidian-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/staff/customers/${interaction.customer.id}`}
                                                    className="font-medium text-obsidian-900 hover:text-emerald-600 transition-colors"
                                                >
                                                    {interaction.customer.name}
                                                </Link>
                                                <p className="text-xs text-obsidian-500 truncate max-w-[200px]">
                                                    {interaction.customer.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium border ${colorClass}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {INTERACTION_LABELS[type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <div className="max-w-[300px]">
                                                    {interaction.subject && (
                                                        <p className="text-sm font-medium text-obsidian-900 truncate">
                                                            {interaction.subject}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-obsidian-500 truncate">
                                                        {interaction.description}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap">
                                                {formatDate(interaction.createdAt)}
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
                                        href={`/staff/interactions?${buildParams({
                                            type: typeFilter === "ALL" ? "" : typeFilter,
                                            page: String(page - 1),
                                        })}`}
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
                                        href={`/staff/interactions?${buildParams({
                                            type: typeFilter === "ALL" ? "" : typeFilter,
                                            page: String(page + 1),
                                        })}`}
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
