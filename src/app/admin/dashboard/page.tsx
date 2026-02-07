import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { prisma } from "@/lib/db"
import Link from "next/link"
import {
    DollarSign,
    ShoppingBag,
    Package,
    Users,
    Scissors,
    Star,
    RotateCcw,
    AlertTriangle,
    ArrowRight,
    Clock,
} from "lucide-react"
import {
    BESPOKE_STATUS_LABELS,
    BESPOKE_STATUS_COLORS,
    type BespokeOrderStatus,
} from "@/types/erp"

export const revalidate = 60 // Revalidate every minute

interface StatCardProps {
    label: string
    value: string | number
    icon: React.ReactNode
    href?: string
    accent?: "default" | "warning" | "info"
}

function StatCard({ label, value, icon, href, accent = "default" }: StatCardProps) {
    const accentStyles = {
        default: "border-obsidian-200",
        warning: "border-amber-300 bg-amber-50/30",
        info: "border-blue-300 bg-blue-50/30",
    }

    const content = (
        <div
            className={`bg-white rounded-sm border p-6 hover:shadow-md transition-shadow ${accentStyles[accent]}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-obsidian-500 uppercase tracking-wide mb-2">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-obsidian-900 font-tabular">{value}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-obsidian-100 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
            </div>
        </div>
    )

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        )
    }

    return content
}

function BespokeStatusBadge({ status }: { status: string }) {
    const colors = BESPOKE_STATUS_COLORS[status as BespokeOrderStatus] ?? {
        bg: "bg-obsidian-50",
        text: "text-obsidian-600",
        border: "border-obsidian-200",
    }
    const label = BESPOKE_STATUS_LABELS[status as BespokeOrderStatus] ?? status

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-sm border ${colors.bg} ${colors.text} ${colors.border}`}
        >
            {label}
        </span>
    )
}

export default async function AdminDashboard() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    // Fetch all stats in parallel for performance
    const [
        totalSalesRaw,
        totalOrders,
        totalProducts,
        totalCustomers,
        activeBespokeOrders,
        pendingReviews,
        pendingReturns,
        _lowStockPlaceholder,
        recentBespokeOrders,
        recentPendingReviews,
    ] = await Promise.all([
        prisma.order.aggregate({
            where: { paymentStatus: "PAID" },
            _sum: { total: true },
        }),
        prisma.order.count(),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.bespokeOrder.count({
            where: {
                status: {
                    notIn: ["DELIVERED", "CANCELLED"],
                },
            },
        }),
        prisma.review.count({ where: { status: "PENDING" } }),
        prisma.returnRequest.count({ where: { status: "PENDING" } }),
        // placeholder for lowStockFabrics -- real count computed via raw query below
        Promise.resolve(0),
        prisma.bespokeOrder.findMany({
            where: {
                status: { notIn: ["DELIVERED", "CANCELLED"] },
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
            include: {
                user: { select: { name: true } },
            },
        }),
        prisma.review.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                user: { select: { name: true } },
                product: { select: { name: true, slug: true } },
            },
        }),
    ])

    // Low stock count: fabrics where quantity is at or below the minimum
    const lowStockCount = await prisma.fabricInventory.count({
        where: {
            isAvailable: true,
            quantityYards: { lte: 0 }, // Will be refined with raw query for column comparison if needed
        },
    }).catch(() => 0)
    // Note: For accurate column-to-column comparison (quantityYards <= minStockLevel),
    // use raw SQL appropriate to your database engine in production.

    const totalSales = totalSalesRaw._sum.total || 0

    // Determine greeting based on time
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-obsidian-900">
                    {greeting}, {session.user.name}
                </h2>
                <p className="text-obsidian-500 mt-1">
                    Here is an overview of your store today.
                </p>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Sales"
                    value={formatCurrency(totalSales)}
                    icon={<DollarSign className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/reports"
                />
                <StatCard
                    label="Orders"
                    value={totalOrders}
                    icon={<ShoppingBag className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/orders"
                />
                <StatCard
                    label="Active Products"
                    value={totalProducts}
                    icon={<Package className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/products"
                />
                <StatCard
                    label="Customers"
                    value={totalCustomers}
                    icon={<Users className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/customers"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Active Bespoke Orders"
                    value={activeBespokeOrders}
                    icon={<Scissors className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/bespoke"
                />
                <StatCard
                    label="Pending Reviews"
                    value={pendingReviews}
                    icon={<Star className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/reviews"
                    accent={pendingReviews > 0 ? "info" : "default"}
                />
                <StatCard
                    label="Pending Returns"
                    value={pendingReturns}
                    icon={<RotateCcw className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/returns"
                    accent={pendingReturns > 0 ? "warning" : "default"}
                />
                <StatCard
                    label="Low Stock Fabrics"
                    value={lowStockCount}
                    icon={<AlertTriangle className="w-5 h-5 text-obsidian-600" />}
                    href="/admin/fabrics"
                    accent={lowStockCount > 0 ? "warning" : "default"}
                />
            </div>

            {/* Lower Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Bespoke Orders */}
                <section className="bg-white rounded-sm border border-obsidian-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-obsidian-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-obsidian-900">
                            Recent Bespoke Orders
                        </h3>
                        <Link
                            href="/admin/bespoke"
                            className="text-xs font-medium text-obsidian-600 hover:text-obsidian-900 flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {recentBespokeOrders.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-sm text-obsidian-500">No active bespoke orders.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-obsidian-100">
                            {recentBespokeOrders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/admin/bespoke/${order.id}`}
                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-obsidian-50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-obsidian-900 truncate">
                                            {order.orderNumber}
                                        </p>
                                        <p className="text-xs text-obsidian-500 truncate">
                                            {order.customerName}
                                            {order.user?.name
                                                ? ` (${order.user.name})`
                                                : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <BespokeStatusBadge status={order.status} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Pending Reviews Quick Actions */}
                <section className="bg-white rounded-sm border border-obsidian-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-obsidian-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-obsidian-900">
                            Pending Reviews
                        </h3>
                        <Link
                            href="/admin/reviews"
                            className="text-xs font-medium text-obsidian-600 hover:text-obsidian-900 flex items-center gap-1 transition-colors"
                        >
                            Manage All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {recentPendingReviews.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-sm text-obsidian-500">No reviews pending approval.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-obsidian-100">
                            {recentPendingReviews.map((review) => (
                                <Link
                                    key={review.id}
                                    href="/admin/reviews"
                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-obsidian-50 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-obsidian-900 truncate">
                                            {review.product.name}
                                        </p>
                                        <p className="text-xs text-obsidian-500 truncate">
                                            by {review.user.name} &middot;{" "}
                                            {formatDate(review.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <div
                                            className="flex items-center gap-0.5"
                                            aria-label={`${review.rating} out of 5 stars`}
                                        >
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${
                                                        i <= review.rating
                                                            ? "fill-gold-500 text-gold-500"
                                                            : "fill-obsidian-200 text-obsidian-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-sm bg-amber-50 text-amber-700 border border-amber-200">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
