import { DollarSign, TrendingUp, ShoppingBag, Wallet, Scissors, Tag, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  getRevenueAnalytics,
  getFinancialSummary,
  getCustomerRevenue,
  getDateRangeFromPreset,
  getComparisonPeriod,
  calculateChangePercent,
} from "@/lib/accounting"
import type { AccountingSearchParams } from "@/lib/accounting-types"
import { StatCard } from "../_components/stat-card"
import { EmptyAccountingState } from "../_components/empty-accounting-state"
import { AreaChart } from "@/components/features/admin/charts/area-chart"
import { DonutChart } from "@/components/features/admin/charts/donut-chart"
import { HorizontalBarChart } from "@/components/features/admin/charts/horizontal-bar-chart"

export const revalidate = 60

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<AccountingSearchParams>
}) {
  const params = await searchParams
  const preset = params.preset || "30d"
  const compare = params.compare === "true"

  const range = getDateRangeFromPreset(preset)
  const comparison = compare ? getComparisonPeriod(range) : undefined

  const [revenue, financial, customers] = await Promise.all([
    getRevenueAnalytics(range, comparison?.previous, "daily"),
    getFinancialSummary(range, comparison?.previous),
    getCustomerRevenue(range, comparison?.previous),
  ])

  const hasData = revenue.totalOrders > 0

  if (!hasData) {
    return <EmptyAccountingState />
  }

  const revenueChange = compare ? calculateChangePercent(revenue.totalRevenue, revenue.comparison?.totalRevenue ?? 0) : undefined
  const netChange = compare ? calculateChangePercent(revenue.netRevenue, revenue.comparison?.netRevenue ?? 0) : undefined
  const aovChange = compare ? calculateChangePercent(revenue.avgOrderValue, revenue.comparison?.avgOrderValue ?? 0) : undefined
  const ordersChange = compare ? calculateChangePercent(revenue.totalOrders, revenue.comparison?.totalOrders ?? 0) : undefined

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(revenue.totalRevenue)}
          previousValue={compare && revenue.comparison ? formatCurrency(revenue.comparison.totalRevenue) : undefined}
          changePercent={revenueChange}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Net Revenue"
          value={formatCurrency(revenue.netRevenue)}
          previousValue={compare && revenue.comparison ? formatCurrency(revenue.comparison.netRevenue) : undefined}
          changePercent={netChange}
          icon={<Wallet className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(revenue.avgOrderValue)}
          previousValue={compare && revenue.comparison ? formatCurrency(revenue.comparison.avgOrderValue) : undefined}
          changePercent={aovChange}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Total Orders"
          value={revenue.totalOrders.toLocaleString()}
          previousValue={compare && revenue.comparison ? revenue.comparison.totalOrders.toLocaleString() : undefined}
          changePercent={ordersChange}
          icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Revenue Chart + Breakdown Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Revenue Over Time</h2>
          </div>
          <div className="p-5">
            <AreaChart
              data={revenue.revenueOverTime.map((p) => ({
                date: p.date,
                value: p.value,
                previousValue: p.previousValue,
              }))}
              showComparison={compare}
            />
          </div>
        </div>

        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Revenue Breakdown</h2>
          </div>
          <div className="p-5 flex justify-center">
            <DonutChart
              data={[
                { label: "Net Revenue", value: revenue.revenueBreakdown.net, color: "#22c55e" },
                { label: "Discounts", value: revenue.revenueBreakdown.discounts, color: "#ef4444" },
                { label: "Shipping", value: revenue.revenueBreakdown.shipping, color: "#3b82f6" },
              ]}
              centerLabel="Gross"
              centerValue={formatCurrency(revenue.revenueBreakdown.gross)}
              size={180}
            />
          </div>
        </div>
      </div>

      {/* Top Categories + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Top Categories</h2>
          </div>
          <div className="p-5">
            <HorizontalBarChart
              data={revenue.topCategories.map((c) => ({
                label: c.categoryName,
                value: c.revenue,
                formattedValue: formatCurrency(c.revenue),
              }))}
              maxBars={5}
              color="bg-gold-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Top Products</h2>
          </div>
          <div className="p-5">
            <HorizontalBarChart
              data={revenue.topProducts.map((p) => ({
                label: p.productName,
                value: p.revenue,
                formattedValue: formatCurrency(p.revenue),
              }))}
              maxBars={5}
              color="bg-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Outstanding"
          value={formatCurrency(financial.outstandingBalances.totalUnpaid)}
          icon={<Wallet className="w-5 h-5 text-red-600" />}
          positiveIsGood={false}
        />
        <StatCard
          label="Bespoke Revenue"
          value={formatCurrency(financial.bespokeSummary.totalFinalRevenue)}
          icon={<Scissors className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label="Coupon Impact"
          value={formatCurrency(financial.totalDiscounts)}
          icon={<Tag className="w-5 h-5 text-red-500" />}
          positiveIsGood={false}
        />
        <StatCard
          label="Avg CLV"
          value={formatCurrency(customers.avgClv)}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
      </div>
    </div>
  )
}
