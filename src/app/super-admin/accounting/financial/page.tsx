import { DollarSign, Tag, Wallet, Truck, Scissors, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  getFinancialSummary,
  getDateRangeFromPreset,
  getComparisonPeriod,
  calculateChangePercent,
} from "@/lib/accounting"
import type { AccountingSearchParams } from "@/lib/accounting-types"
import { StatCard } from "../_components/stat-card"
import { EmptyAccountingState } from "../_components/empty-accounting-state"
import { DataTable } from "../_components/data-table"
import { ProgressBar } from "../_components/progress-bar"
import { StackedBarChart } from "@/components/features/admin/charts/stacked-bar-chart"

export const revalidate = 60

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<AccountingSearchParams>
}) {
  const params = await searchParams
  const preset = params.preset || "30d"
  const compare = params.compare === "true"
  const granularity = params.granularity || "monthly"

  const range = getDateRangeFromPreset(preset)
  const comparison = compare ? getComparisonPeriod(range) : undefined

  const financial = await getFinancialSummary(range, comparison?.previous, granularity)

  const hasData = financial.grossRevenue > 0 || financial.bespokeSummary.orderCount > 0 || financial.outstandingBalances.unpaidOrders.length > 0

  if (!hasData) {
    return <EmptyAccountingState />
  }

  const grossChange = compare ? calculateChangePercent(financial.grossRevenue, financial.comparison?.grossRevenue ?? 0) : undefined
  const discountChange = compare ? calculateChangePercent(financial.totalDiscounts, financial.comparison?.totalDiscounts ?? 0) : undefined
  const netChange = compare ? calculateChangePercent(financial.netRevenue, financial.comparison?.netRevenue ?? 0) : undefined
  const shippingChange = compare ? calculateChangePercent(financial.shippingRevenue, financial.comparison?.shippingRevenue ?? 0) : undefined

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross Revenue"
          value={formatCurrency(financial.grossRevenue)}
          previousValue={compare && financial.comparison ? formatCurrency(financial.comparison.grossRevenue) : undefined}
          changePercent={grossChange}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Total Discounts"
          value={formatCurrency(financial.totalDiscounts)}
          previousValue={compare && financial.comparison ? formatCurrency(financial.comparison.totalDiscounts) : undefined}
          changePercent={discountChange}
          positiveIsGood={false}
          icon={<Tag className="w-5 h-5 text-red-500" />}
        />
        <StatCard
          label="Net Revenue"
          value={formatCurrency(financial.netRevenue)}
          previousValue={compare && financial.comparison ? formatCurrency(financial.comparison.netRevenue) : undefined}
          changePercent={netChange}
          icon={<Wallet className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Shipping Revenue"
          value={formatCurrency(financial.shippingRevenue)}
          previousValue={compare && financial.comparison ? formatCurrency(financial.comparison.shippingRevenue) : undefined}
          changePercent={shippingChange}
          icon={<Truck className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Revenue Composition */}
      {financial.revenueComposition.length > 0 && (
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Revenue Composition Over Time</h2>
            <p className="text-xs text-obsidian-500 mt-1">Net revenue, discounts, and shipping breakdown</p>
          </div>
          <div className="p-5">
            <StackedBarChart
              data={financial.revenueComposition.map((p) => ({
                date: p.date,
                segments: [
                  { label: "Net", value: p.net, color: "#22c55e" },
                  { label: "Discounts", value: p.discounts, color: "#ef4444" },
                  { label: "Shipping", value: p.shipping, color: "#3b82f6" },
                ],
              }))}
            />
          </div>
        </div>
      )}

      {/* Coupon Impact */}
      {financial.couponImpact.length > 0 && (
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900">Coupon Usage Impact</h2>
          </div>
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { key: "code", label: "Code" },
                { key: "uses", label: "Times Used", align: "right" },
                { key: "discount", label: "Total Discount", align: "right" },
                { key: "revenue", label: "Revenue Generated", align: "right" },
                { key: "avgDiscount", label: "Avg Discount/Order", align: "right" },
              ]}
              rows={financial.couponImpact.map((c) => ({
                code: (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-obsidian-100 text-xs font-mono font-medium text-obsidian-700">
                    {c.code}
                  </span>
                ),
                uses: <span className="font-tabular">{c.timesUsed}</span>,
                discount: <span className="font-tabular text-red-600">{formatCurrency(c.totalDiscount)}</span>,
                revenue: <span className="font-tabular font-medium text-obsidian-900">{formatCurrency(c.revenueGenerated)}</span>,
                avgDiscount: <span className="font-tabular">{formatCurrency(c.avgDiscountPerOrder)}</span>,
              }))}
              emptyMessage="No coupon usage data"
            />
          </div>
        </div>
      )}

      {/* Bespoke Orders + Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bespoke Summary */}
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900 flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Bespoke Orders Summary
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {financial.bespokeSummary.orderCount === 0 ? (
              <p className="text-sm text-obsidian-500">No bespoke orders in this period</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-obsidian-500 uppercase tracking-wide">Total Estimates</p>
                    <p className="text-lg font-bold text-obsidian-900 font-tabular">
                      {formatCurrency(financial.bespokeSummary.totalEstimates)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-obsidian-500 uppercase tracking-wide">Deposits Received</p>
                    <p className="text-lg font-bold text-obsidian-900 font-tabular">
                      {formatCurrency(financial.bespokeSummary.totalDeposits)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-obsidian-500 uppercase tracking-wide">Final Revenue</p>
                    <p className="text-lg font-bold text-obsidian-900 font-tabular">
                      {formatCurrency(financial.bespokeSummary.totalFinalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-obsidian-500 uppercase tracking-wide">Order Count</p>
                    <p className="text-lg font-bold text-obsidian-900 font-tabular">
                      {financial.bespokeSummary.orderCount}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-obsidian-500 mb-2">Completion Rate</p>
                  <ProgressBar
                    value={financial.bespokeSummary.completionRate}
                    max={100}
                    color="bg-green-500"
                    showPercent
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
          <div className="p-5 border-b border-obsidian-200">
            <h2 className="text-base font-semibold text-obsidian-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Outstanding Balances
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-obsidian-500 uppercase tracking-wide">Unpaid Orders</p>
                <p className="text-lg font-bold text-red-600 font-tabular">
                  {formatCurrency(financial.outstandingBalances.totalUnpaid)}
                </p>
                <p className="text-xs text-obsidian-500">{financial.outstandingBalances.unpaidOrders.length} orders</p>
              </div>
              <div>
                <p className="text-xs text-obsidian-500 uppercase tracking-wide">Bespoke Balances</p>
                <p className="text-lg font-bold text-amber-600 font-tabular">
                  {formatCurrency(financial.outstandingBalances.totalBespokeOwed)}
                </p>
                <p className="text-xs text-obsidian-500">{financial.outstandingBalances.bespokeBalances.length} orders</p>
              </div>
            </div>

            {financial.outstandingBalances.unpaidOrders.length > 0 && (
              <div>
                <p className="text-xs font-medium text-obsidian-700 mb-2">Recent Unpaid Orders</p>
                <div className="space-y-2">
                  {financial.outstandingBalances.unpaidOrders.slice(0, 5).map((o) => (
                    <div key={o.orderNumber} className="flex items-center justify-between py-1.5 border-b border-obsidian-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-obsidian-900">{o.orderNumber}</p>
                        <p className="text-xs text-obsidian-500">{o.customerEmail ?? "Guest"}</p>
                      </div>
                      <p className="text-xs font-semibold text-red-600 font-tabular">{formatCurrency(o.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
