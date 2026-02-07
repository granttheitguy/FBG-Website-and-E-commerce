import { prisma } from "@/lib/db"
import { Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CouponFormDialog } from "./coupon-form-dialog"
import { CouponActions } from "./coupon-actions"
import type { Coupon } from "@prisma/client"

async function getCoupons() {
    return await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
    })
}

export default async function CouponsPage() {
    const coupons = await getCoupons()

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-obsidian-900 font-serif">Coupons</h1>
                    <p className="text-obsidian-500 mt-1">Manage discount codes and promotions</p>
                </div>
                <CouponFormDialog mode="create">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                    </Button>
                </CouponFormDialog>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-obsidian-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Discount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Usage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Min. Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Expires
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-200">
                        {coupons.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <Tag className="w-12 h-12 mx-auto mb-3 text-obsidian-300" />
                                    <p className="text-obsidian-500">No coupons created yet</p>
                                    <p className="text-sm text-obsidian-400 mt-1">
                                        Create your first coupon to start offering discounts
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            coupons.map((coupon) => {
                                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                                const isMaxedOut = coupon.maxUses && coupon.usedCount >= coupon.maxUses

                                return (
                                    <tr key={coupon.id} className="hover:bg-obsidian-50">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-semibold text-obsidian-900">
                                                {coupon.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-700">
                                            {coupon.type === "PERCENTAGE"
                                                ? `${coupon.value}%`
                                                : formatCurrency(coupon.value)}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-700">
                                            {coupon.usedCount}
                                            {coupon.maxUses && ` / ${coupon.maxUses}`}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-700">
                                            {coupon.minOrderAmount
                                                ? formatCurrency(coupon.minOrderAmount)
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-700">
                                            {coupon.expiresAt ? (
                                                <span className={isExpired ? "text-red-600" : ""}>
                                                    {new Date(coupon.expiresAt).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                "Never"
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!coupon.isActive ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-obsidian-100 text-obsidian-700">
                                                    Inactive
                                                </span>
                                            ) : isExpired ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-700">
                                                    Expired
                                                </span>
                                            ) : isMaxedOut ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-orange-100 text-orange-700">
                                                    Maxed Out
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-700">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <CouponActions coupon={coupon} />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
