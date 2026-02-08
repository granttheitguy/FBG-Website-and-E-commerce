import { ShoppingBag, CreditCard, Package, Target } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  getSalesAnalytics,
  getDateRangeFromPreset,
  getComparisonPeriod,
  calculateChangePercent,
} from "@/lib/accounting"
import type { AccountingSearchParams } from "@/lib/accounting-types"
import { StatCard } from "../_components/stat-card"
import { EmptyAccountingState } from "../_components/empty-accounting-state"
import { DataTable } from "../_components/data-table"
import { BarChart } from "@/components/features/admin/charts/bar-chart"
import { DonutChart } from "@/components/features/admin/charts/donut-chart"
import { HorizontalBarChart } from "@/components/features/admin/charts/horizontal-bar-chart"

export const revalidate = 60

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#eab308",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  PAID: "#22c55e",
  UNPAID: "#ef4444",
  REFUNDED: "#f97316",
}

export default async function SalesPage({
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

  const sales = await getSalesAnalytics(range, comparison?.previous, granularity)

  if (sales.totalOrders === 0) {
    return <EmptyAccountingState />
  }

  const ordersChange = compare ? calculateChangePercent(sales.totalOrders, sales.comparison?.totalOrders ?? 0) : undefined
  const paidChange = compare ? calculateChangePercent(sales.paidOrders, sales.comparison?.paidOrders ?? 0) : undefined

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={sales.totalOrders.toLocaleString()}
          previousValue={compare && sales.comparison ? sales.comparison.totalOrders.toLocaleString() : undefined}
          changePercent={ordersChange}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Paid Orders"
          value={sales.paidOrders.toLocaleString()}
          previousValue={compare && sales.comparison ? sales.comparison.paidOrders.toLocaleString() : undefined}
          changePercent={paidChange}
          icon={<CreditCard className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Avg Items / Order"
          value={sales.avgItemsPerOrder.toFixed(1)}
          icon={<Package className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Conversion Rate"
          value={`${sales.conversionRate.toFixed(1)}%`}
          icon={<Target className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Orders Over Time */}
      <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
        <div className="p-5 border-b border-obsidian-200">
          <h2 className="text-base font-semibold text-obsidian-900">Orders Over Time</h2>
          <p className="text-xs text-obsidian-500 mt-1">
            {granularity === "daily" ? "Daily" : granularity === "weekly" ? "Weekly" : "Monthly"} order count
          </p>
        </div>
        <div className="p-5">
          <BarChart
            data={sales.ordersOverTime.map((p) => ({
              label: p.date,
              value: p.value,
            }))}
            color="#3b82f6"
            formatValue={(v) => v.toFixed(0)}
          />
        </div>
      </div>

      {/* Status Donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Order Status</h2>
          </div>
          <div className="p-5 flex justify-center">
            <DonutChart
              data={sales.orderStatusDistribution.map((s) => ({
                label: s.status,
                value: s.count,
                color: STATUS_COLORS[s.status] || "#78716c",
              }))}
              centerLabel="Orders"
              centerValue={sales.totalOrders.toLocaleString()}
            />
          </div>
        </div>

        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Payment Status</h2>
          </div>
          <div className="p-5 flex justify-center">
            <DonutChart
              data={sales.paymentStatusDistribution.map((s) => ({
                label: s.status,
                value: s.count,
                color: STATUS_COLORS[s.status] || "#78716c",
              }))}
              centerLabel="Payments"
              centerValue={sales.totalOrders.toLocaleString()}
            />
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
        <div className="p-5 border-b border-obsidian-200">
          <h2 className="text-base font-semibold text-obsidian-900">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "rank", label: "#", align: "center" },
              { key: "product", label: "Product" },
              { key: "units", label: "Units Sold", align: "right" },
              { key: "revenue", label: "Revenue", align: "right" },
              { key: "avgPrice", label: "Avg Unit Price", align: "right" },
            ]}
            rows={sales.topSellingProducts.map((p) => ({
              rank: (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-obsidian-100 text-obsidian-700 text-xs font-bold">
                  {p.rank}
                </span>
              ),
              product: <span className="font-medium text-obsidian-900">{p.productName}</span>,
              units: <span className="font-tabular">{p.unitsSold.toLocaleString()}</span>,
              revenue: <span className="font-tabular font-medium text-obsidian-900">{formatCurrency(p.revenue)}</span>,
              avgPrice: <span className="font-tabular">{formatCurrency(p.avgUnitPrice)}</span>,
            }))}
            emptyMessage="No sales data available"
          />
        </div>
      </div>

      {/* Sales by Category */}
      <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
        <div className="p-5 border-b border-obsidian-200">
          <h2 className="text-base font-semibold text-obsidian-900">Sales by Category</h2>
        </div>
        <div className="p-5">
          <HorizontalBarChart
            data={sales.salesByCategory.map((c) => ({
              label: c.categoryName,
              value: c.revenue,
              formattedValue: formatCurrency(c.revenue),
            }))}
            color="bg-gold-500"
          />
        </div>
      </div>
    </div>
  )
}
