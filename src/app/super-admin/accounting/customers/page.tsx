import { Users, TrendingUp, UserPlus, Repeat } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  getCustomerRevenue,
  getDateRangeFromPreset,
  getComparisonPeriod,
  calculateChangePercent,
} from "@/lib/accounting"
import type { AccountingSearchParams } from "@/lib/accounting-types"
import { StatCard } from "../_components/stat-card"
import { EmptyAccountingState } from "../_components/empty-accounting-state"
import { DataTable } from "../_components/data-table"
import { DonutChart } from "@/components/features/admin/charts/donut-chart"
import { BarChart } from "@/components/features/admin/charts/bar-chart"

export const revalidate = 60

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<AccountingSearchParams>
}) {
  const params = await searchParams
  const preset = params.preset || "30d"
  const compare = params.compare === "true"

  const range = getDateRangeFromPreset(preset)
  const comparison = compare ? getComparisonPeriod(range) : undefined

  const customers = await getCustomerRevenue(range, comparison?.previous)

  const hasData = customers.topCustomers.length > 0

  if (!hasData) {
    return <EmptyAccountingState />
  }

  const clvChange = compare ? calculateChangePercent(customers.avgClv, customers.comparison?.avgClv ?? 0) : undefined
  const newCustChange = compare ? calculateChangePercent(customers.newCustomerCount, customers.comparison?.newCustomerCount ?? 0) : undefined

  const maxSpend = customers.topCustomers.length > 0 ? customers.topCustomers[0].totalSpent : 1

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Avg CLV"
          value={formatCurrency(customers.avgClv)}
          previousValue={compare && customers.comparison ? formatCurrency(customers.comparison.avgClv) : undefined}
          changePercent={clvChange}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Median CLV"
          value={formatCurrency(customers.medianClv)}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="New Customers"
          value={customers.newCustomerCount.toLocaleString()}
          previousValue={compare && customers.comparison ? customers.comparison.newCustomerCount.toLocaleString() : undefined}
          changePercent={newCustChange}
          icon={<UserPlus className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Returning Revenue"
          value={`${customers.returningRevenuePercent.toFixed(1)}%`}
          icon={<Repeat className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* New vs Returning + Acquisition Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">New vs Returning Revenue</h2>
          </div>
          <div className="p-5 flex justify-center">
            <DonutChart
              data={[
                { label: "New Customers", value: customers.newVsReturningRevenue.newRevenue, color: "#22c55e" },
                { label: "Returning Customers", value: customers.newVsReturningRevenue.returningRevenue, color: "#3b82f6" },
              ]}
              centerLabel="Total"
              centerValue={formatCurrency(
                customers.newVsReturningRevenue.newRevenue + customers.newVsReturningRevenue.returningRevenue
              )}
              size={200}
            />
          </div>
        </div>

        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Customer Acquisition Trend</h2>
            <p className="text-xs text-obsidian-500 mt-1">New customers per month</p>
          </div>
          <div className="p-5">
            <BarChart
              data={customers.customerAcquisitionTrend.map((p) => ({
                label: p.date,
                value: p.value,
              }))}
              color="#22c55e"
              formatValue={(v) => v.toFixed(0)}
            />
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
        <div className="p-5 border-b border-obsidian-200">
          <h2 className="text-base font-semibold text-obsidian-900">Top 20 Customers by Spend</h2>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "rank", label: "#", align: "center" },
              { key: "customer", label: "Customer" },
              { key: "email", label: "Email" },
              { key: "orders", label: "Orders", align: "right" },
              { key: "spent", label: "Total Spent", align: "right" },
              { key: "bar", label: "" },
              { key: "lastOrder", label: "Last Order", align: "right" },
            ]}
            rows={customers.topCustomers.map((c) => ({
              rank: (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-obsidian-100 text-obsidian-700 text-xs font-bold">
                  {c.rank}
                </span>
              ),
              customer: <span className="font-medium text-obsidian-900">{c.name}</span>,
              email: <span className="text-obsidian-500 text-xs">{c.email}</span>,
              orders: <span className="font-tabular">{c.orderCount}</span>,
              spent: <span className="font-tabular font-medium text-obsidian-900">{formatCurrency(c.totalSpent)}</span>,
              bar: (
                <div className="w-24 h-2 bg-obsidian-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(c.totalSpent / maxSpend) * 100}%` }}
                  />
                </div>
              ),
              lastOrder: (
                <span className="text-xs text-obsidian-500">
                  {c.lastOrderDate ? formatDate(c.lastOrderDate) : "N/A"}
                </span>
              ),
            }))}
            emptyMessage="No customer data available"
          />
        </div>
      </div>
    </div>
  )
}
