import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import CouponsClient from "./CouponsClient"

export default async function AdminCouponsPage() {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" }
    })

    const isExpired = (expiresAt: Date | null) => {
        if (!expiresAt) return false
        return new Date(expiresAt) < new Date()
    }

    const isActive = (coupon: typeof coupons[0]) => {
        if (!coupon.isActive) return false
        if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return false
        if (isExpired(coupon.expiresAt)) return false
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return false
        return true
    }

    const getStatusBadge = (coupon: typeof coupons[0]) => {
        if (!coupon.isActive) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-obsidian-100 text-obsidian-800">Inactive</span>
        }
        if (isExpired(coupon.expiresAt)) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Limit Reached</span>
        }
        if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
    }

    // Serialize dates for client component
    const serializedCoupons = coupons.map(c => ({
        ...c,
        startsAt: c.startsAt?.toISOString() || null,
        expiresAt: c.expiresAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }))

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-[-0.02em] text-obsidian-900 mb-2">Coupons</h1>
                    <p className="text-obsidian-600">Manage discount coupons and promotional codes</p>
                </div>
                <CouponsClient coupons={serializedCoupons} />
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Code</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Type</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Value</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Min Order</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Uses</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Valid Dates</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-obsidian-500">
                                        No coupons found. Create your first coupon to get started.
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-obsidian-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-semibold text-obsidian-900 bg-obsidian-50 px-2 py-1 rounded inline-block">
                                                {coupon.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {coupon.type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-obsidian-900 font-tabular">
                                            {coupon.type === "PERCENTAGE"
                                                ? `${coupon.value}%`
                                                : formatCurrency(coupon.value)}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 font-tabular">
                                            {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 font-tabular">
                                            <span className={coupon.maxUses && coupon.usedCount >= coupon.maxUses ? "text-red-600 font-medium" : ""}>
                                                {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(coupon)}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 text-xs">
                                            {coupon.startsAt && (
                                                <div>From: {formatDate(coupon.startsAt)}</div>
                                            )}
                                            {coupon.expiresAt && (
                                                <div className={isExpired(coupon.expiresAt) ? "text-red-600 font-medium" : ""}>
                                                    Until: {formatDate(coupon.expiresAt)}
                                                </div>
                                            )}
                                            {!coupon.startsAt && !coupon.expiresAt && "—"}
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
