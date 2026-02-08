import { DollarSign, TrendingUp, ShoppingBag, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  getRevenueAnalytics,
  getDateRangeFromPreset,
  getComparisonPeriod,
  calculateChangePercent,
} from "@/lib/accounting"
import type { AccountingSearchParams } from "@/lib/accounting-types"
import { StatCard } from "../_components/stat-card"
import { EmptyAccountingState } from "../_components/empty-accounting-state"
import { DataTable } from "../_components/data-table"
import { AreaChart } from "@/components/features/admin/charts/area-chart"
import { BarChart } from "@/components/features/admin/charts/bar-chart"

export const revalidate = 60

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<AccountingSearchParams>
}) {
  const params = await searchParams
  const preset = params.preset || "30d"
  const compare = params.compare === "true"
  const granularity = params.granularity || "daily"

  const range = getDateRangeFromPreset(preset)
  const comparison = compare ? getComparisonPeriod(range) : undefined

  const revenue = await getRevenueAnalytics(range, comparison?.previous, granularity)

  if (revenue.totalOrders === 0) {
    return <EmptyAccountingState />
  }

  const durationDays = Math.max(1, Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const revenuePerDay = revenue.totalRevenue / durationDays

  const revenueChange = compare ? calculateChangePercent(revenue.totalRevenue, revenue.comparison?.totalRevenue ?? 0) : undefined
  const aovChange = compare ? calculateChangePercent(revenue.avgOrderValue, revenue.comparison?.avgOrderValue ?? 0) : undefined

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(revenue.totalRevenue)}
          previousValue={compare && revenue.comparison ? formatCurrency(revenue.comparison.totalRevenue) : undefined}
          changePercent={revenueChange}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Growth Rate"
          value={revenueChange !== undefined ? `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}%` : "N/A"}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(revenue.avgOrderValue)}
          previousValue={compare && revenue.comparison ? formatCurrency(revenue.comparison.avgOrderValue) : undefined}
          changePercent={aovChange}
          icon={<ShoppingBag className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Revenue / Day"
          value={formatCurrency(revenuePerDay)}
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
        <div className="p-5 border-b border-obsidian-200">
          <h2 className="text-base font-semibold text-obsidian-900">Revenue Trend</h2>
          <p className="text-xs text-obsidian-500 mt-1">
            {granularity === "daily" ? "Daily" : granularity === "weekly" ? "Weekly" : "Monthly"} revenue
            {compare ? " vs previous period" : ""}
          </p>
        </div>
        <div className="p-5">
          <AreaChart
            data={revenue.revenueOverTime.map((p) => ({
              date: p.date,
              value: p.value,
              previousValue: p.previousValue,
            }))}
            showComparison={compare}
            height={280}
          />
        </div>
      </div>

      {/* Revenue by Category + Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Revenue by Category</h2>
          </div>
          <div className="p-5">
            <BarChart
              data={revenue.topCategories.map((c) => ({
                label: c.categoryName,
                value: c.revenue,
              }))}
              color="#C8973E"
            />
          </div>
        </div>

        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Revenue by Product (Top 10)</h2>
          </div>
          <div className="p-5">
            <BarChart
              data={revenue.topProducts.slice(0, 10).map((p) => ({
                label: p.productName.length > 20 ? p.productName.substring(0, 20) + "..." : p.productName,
                value: p.revenue,
              }))}
              color="#3b82f6"
            />
          </div>
        </div>
      </div>

      {/* Product Revenue Detail Table */}
      <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
        <div className="p-5 border-b border-obsidian-200">
          <h2 className="text-base font-semibold text-obsidian-900">Product Revenue Detail</h2>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "product", label: "Product" },
              { key: "category", label: "Category" },
              { key: "units", label: "Units Sold", align: "right" },
              { key: "revenue", label: "Revenue", align: "right" },
              { key: "percent", label: "% of Total", align: "right" },
            ]}
            rows={revenue.topProducts.map((p) => ({
              product: <span className="font-medium text-obsidian-900">{p.productName}</span>,
              category: <span className="text-obsidian-500">{p.categoryName ?? "Uncategorized"}</span>,
              units: <span className="font-tabular">{p.unitsSold.toLocaleString()}</span>,
              revenue: <span className="font-tabular font-medium text-obsidian-900">{formatCurrency(p.revenue)}</span>,
              percent: <span className="font-tabular">{p.percentOfTotal.toFixed(1)}%</span>,
            }))}
            emptyMessage="No product revenue data available"
          />
        </div>
      </div>
    </div>
  )
}
