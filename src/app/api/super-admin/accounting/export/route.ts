import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import {
  getRevenueAnalytics,
  getSalesAnalytics,
  getFinancialSummary,
  getCustomerRevenue,
  getDateRangeFromPreset,
} from "@/lib/accounting"
import type { DatePreset } from "@/lib/accounting-types"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const tab = searchParams.get("tab") || "overview"
  const preset = (searchParams.get("preset") || "30d") as DatePreset

  const range = getDateRangeFromPreset(preset)

  let csv = ""
  let filename = ""
  const dateStr = new Date().toISOString().split("T")[0]

  switch (tab) {
    case "overview":
    case "revenue": {
      const data = await getRevenueAnalytics(range, undefined, "daily")
      csv = "Product,Category,Units Sold,Revenue,% of Total\n"
      for (const p of data.topProducts) {
        csv += `"${p.productName}","${p.categoryName ?? ""}",${p.unitsSold},${p.revenue},${p.percentOfTotal.toFixed(1)}%\n`
      }
      filename = `fbg-accounting-revenue-${dateStr}.csv`
      break
    }

    case "sales": {
      const data = await getSalesAnalytics(range, undefined, "daily")
      csv = "Rank,Product,Units Sold,Revenue,Avg Unit Price\n"
      for (const p of data.topSellingProducts) {
        csv += `${p.rank},"${p.productName}",${p.unitsSold},${p.revenue},${p.avgUnitPrice.toFixed(2)}\n`
      }
      filename = `fbg-accounting-sales-${dateStr}.csv`
      break
    }

    case "financial": {
      const data = await getFinancialSummary(range, undefined, "monthly")

      csv = "Metric,Value\n"
      csv += `Gross Revenue,${data.grossRevenue}\n`
      csv += `Total Discounts,${data.totalDiscounts}\n`
      csv += `Net Revenue,${data.netRevenue}\n`
      csv += `Shipping Revenue,${data.shippingRevenue}\n`
      csv += `\nCoupon Code,Times Used,Total Discount,Revenue Generated,Avg Discount/Order\n`
      for (const c of data.couponImpact) {
        csv += `"${c.code}",${c.timesUsed},${c.totalDiscount},${c.revenueGenerated},${c.avgDiscountPerOrder.toFixed(2)}\n`
      }
      csv += `\nOutstanding Order,Customer,Total,Status\n`
      for (const o of data.outstandingBalances.unpaidOrders) {
        csv += `"${o.orderNumber}","${o.customerEmail ?? "Guest"}",${o.total},"${o.status}"\n`
      }
      filename = `fbg-accounting-financial-${dateStr}.csv`
      break
    }

    case "customers": {
      const data = await getCustomerRevenue(range)
      csv = "Rank,Customer,Email,Orders,Total Spent,Last Order\n"
      for (const c of data.topCustomers) {
        csv += `${c.rank},"${c.name}","${c.email}",${c.orderCount},${c.totalSpent},"${c.lastOrderDate ? new Date(c.lastOrderDate).toISOString().split("T")[0] : "N/A"}"\n`
      }
      filename = `fbg-accounting-customers-${dateStr}.csv`
      break
    }

    default:
      return NextResponse.json({ error: "Invalid tab" }, { status: 400 })
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
