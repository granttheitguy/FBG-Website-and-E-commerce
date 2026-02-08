import { prisma } from "@/lib/db"
import type {
  DateRange,
  ComparisonPeriod,
  RevenueOverview,
  SalesOverview,
  FinancialOverview,
  CustomerRevenueOverview,
  ComparisonTrendPoint,
  TrendPoint,
  CategoryRevenue,
  ProductRevenue,
  StatusCount,
  TopSellingProduct,
  RevenueCompositionPoint,
  CouponImpact,
  OutstandingOrder,
  OutstandingBespoke,
  TopCustomer,
  DatePreset,
} from "./accounting-types"

// ============================================
// DATE UTILITIES
// ============================================

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const endDate = new Date()
  const startDate = new Date()

  switch (preset) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7)
      break
    case "30d":
      startDate.setDate(endDate.getDate() - 30)
      break
    case "90d":
      startDate.setDate(endDate.getDate() - 90)
      break
    case "ytd":
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
      break
    case "1y":
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    case "all":
      startDate.setFullYear(2020, 0, 1)
      break
  }

  return { startDate, endDate }
}

export function getComparisonPeriod(range: DateRange): ComparisonPeriod {
  const durationMs = range.endDate.getTime() - range.startDate.getTime()
  const previousEnd = new Date(range.startDate.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - durationMs)

  return {
    current: range,
    previous: { startDate: previousStart, endDate: previousEnd },
  }
}

function groupByGranularity(
  items: Array<{ date: Date; value: number }>,
  granularity: "daily" | "weekly" | "monthly"
): TrendPoint[] {
  const map = new Map<string, number>()

  for (const item of items) {
    let key: string
    const d = new Date(item.date)

    if (granularity === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    } else if (granularity === "weekly") {
      const startOfWeek = new Date(d)
      startOfWeek.setDate(d.getDate() - d.getDay())
      key = startOfWeek.toISOString().split("T")[0]
    } else {
      key = d.toISOString().split("T")[0]
    }

    map.set(key, (map.get(key) || 0) + item.value)
  }

  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function calculateChangePercent(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined
  return ((current - previous) / previous) * 100
}

// ============================================
// REVENUE ANALYTICS
// ============================================

export async function getRevenueAnalytics(
  range: DateRange,
  previousRange?: DateRange,
  granularity: "daily" | "weekly" | "monthly" = "daily"
): Promise<RevenueOverview & { comparison?: { totalRevenue: number; netRevenue: number; avgOrderValue: number; totalOrders: number } }> {
  const where = {
    paymentStatus: "PAID",
    createdAt: { gte: range.startDate, lte: range.endDate },
  }

  const [
    aggregate,
    orders,
    categoryRevenue,
    productRevenue,
    previousAggregate,
  ] = await Promise.all([
    prisma.order.aggregate({
      where,
      _sum: { total: true, subtotal: true, shippingCost: true, discountTotal: true },
      _count: true,
      _avg: { total: true },
    }),

    prisma.order.findMany({
      where,
      select: { createdAt: true, total: true, subtotal: true, shippingCost: true, discountTotal: true },
    }),

    prisma.$queryRaw<Array<{ categoryName: string; revenue: number; orderCount: bigint }>>`
      SELECT
        c.name as "categoryName",
        COALESCE(SUM(oi."totalPrice"), 0) as revenue,
        COUNT(DISTINCT o.id) as "orderCount"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o.id
      INNER JOIN "Product" p ON oi."productId" = p.id
      INNER JOIN "_CategoryToProduct" cp ON p.id = cp."B"
      INNER JOIN "Category" c ON cp."A" = c.id
      WHERE o."paymentStatus" = 'PAID'
        AND o."createdAt" >= ${range.startDate}
        AND o."createdAt" <= ${range.endDate}
      GROUP BY c.name
      ORDER BY revenue DESC
      LIMIT 10
    `,

    prisma.$queryRaw<Array<{ productId: string; productName: string; categoryName: string | null; unitsSold: bigint; revenue: number }>>`
      SELECT
        p.id as "productId",
        p.name as "productName",
        c.name as "categoryName",
        COALESCE(SUM(oi.quantity), 0) as "unitsSold",
        COALESCE(SUM(oi."totalPrice"), 0) as revenue
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o.id
      INNER JOIN "Product" p ON oi."productId" = p.id
      LEFT JOIN "_CategoryToProduct" cp ON p.id = cp."B"
      LEFT JOIN "Category" c ON cp."A" = c.id
      WHERE o."paymentStatus" = 'PAID'
        AND o."createdAt" >= ${range.startDate}
        AND o."createdAt" <= ${range.endDate}
      GROUP BY p.id, p.name, c.name
      ORDER BY revenue DESC
      LIMIT 10
    `,

    previousRange
      ? prisma.order.aggregate({
          where: {
            paymentStatus: "PAID",
            createdAt: { gte: previousRange.startDate, lte: previousRange.endDate },
          },
          _sum: { total: true, subtotal: true, shippingCost: true, discountTotal: true },
          _count: true,
          _avg: { total: true },
        })
      : null,
  ])

  const totalRevenue = aggregate._sum.total ?? 0
  const totalSubtotal = aggregate._sum.subtotal ?? 0
  const totalShipping = aggregate._sum.shippingCost ?? 0
  const totalDiscounts = aggregate._sum.discountTotal ?? 0
  const netRevenue = totalSubtotal - totalDiscounts

  // Revenue over time
  const revenuePoints = orders.map((o) => ({ date: o.createdAt, value: o.total }))
  const grouped = groupByGranularity(revenuePoints, granularity)

  // Previous period data for comparison
  let previousGrouped: TrendPoint[] = []
  if (previousRange) {
    const prevOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: previousRange.startDate, lte: previousRange.endDate },
      },
      select: { createdAt: true, total: true },
    })
    const prevPoints = prevOrders.map((o) => ({ date: o.createdAt, value: o.total }))
    previousGrouped = groupByGranularity(prevPoints, granularity)
  }

  const revenueOverTime: ComparisonTrendPoint[] = grouped.map((point, i) => ({
    ...point,
    previousValue: previousGrouped[i]?.value,
  }))

  const totalRevenueAll = categoryRevenue.reduce((sum, c) => sum + Number(c.revenue), 0)

  const topCategories: CategoryRevenue[] = categoryRevenue.map((c) => ({
    categoryName: c.categoryName,
    revenue: Number(c.revenue),
    orderCount: Number(c.orderCount),
    percentOfTotal: totalRevenueAll > 0 ? (Number(c.revenue) / totalRevenueAll) * 100 : 0,
  }))

  const totalProductRevenue = productRevenue.reduce((sum, p) => sum + Number(p.revenue), 0)

  const topProducts: ProductRevenue[] = productRevenue.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    categoryName: p.categoryName,
    unitsSold: Number(p.unitsSold),
    revenue: Number(p.revenue),
    percentOfTotal: totalProductRevenue > 0 ? (Number(p.revenue) / totalProductRevenue) * 100 : 0,
  }))

  return {
    totalRevenue,
    netRevenue,
    avgOrderValue: aggregate._avg.total ?? 0,
    totalOrders: aggregate._count,
    revenueOverTime,
    revenueBreakdown: {
      gross: totalSubtotal,
      discounts: totalDiscounts,
      shipping: totalShipping,
      net: netRevenue,
    },
    topCategories,
    topProducts,
    comparison: previousAggregate
      ? {
          totalRevenue: previousAggregate._sum.total ?? 0,
          netRevenue: (previousAggregate._sum.subtotal ?? 0) - (previousAggregate._sum.discountTotal ?? 0),
          avgOrderValue: previousAggregate._avg.total ?? 0,
          totalOrders: previousAggregate._count,
        }
      : undefined,
  }
}

// ============================================
// SALES ANALYTICS
// ============================================

export async function getSalesAnalytics(
  range: DateRange,
  previousRange?: DateRange,
  granularity: "daily" | "weekly" | "monthly" = "daily"
): Promise<SalesOverview & { comparison?: { totalOrders: number; paidOrders: number } }> {
  const baseWhere = {
    createdAt: { gte: range.startDate, lte: range.endDate },
  }

  const [
    totalOrdersResult,
    paidOrdersResult,
    avgItemsResult,
    allOrders,
    ordersByStatus,
    ordersByPaymentStatus,
    topProducts,
    salesByCategory,
    previousTotal,
    previousPaid,
  ] = await Promise.all([
    prisma.order.count({ where: baseWhere }),

    prisma.order.count({ where: { ...baseWhere, paymentStatus: "PAID" } }),

    prisma.orderItem.aggregate({
      where: { order: baseWhere },
      _avg: { quantity: true },
      _sum: { quantity: true },
    }),

    prisma.order.findMany({
      where: baseWhere,
      select: { createdAt: true },
    }),

    prisma.order.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),

    prisma.order.groupBy({
      by: ["paymentStatus"],
      where: baseWhere,
      _count: { _all: true },
    }),

    prisma.$queryRaw<Array<{ productId: string; productName: string; unitsSold: bigint; revenue: number; avgPrice: number }>>`
      SELECT
        p.id as "productId",
        p.name as "productName",
        COALESCE(SUM(oi.quantity), 0) as "unitsSold",
        COALESCE(SUM(oi."totalPrice"), 0) as revenue,
        CASE WHEN SUM(oi.quantity) > 0 THEN SUM(oi."totalPrice") / SUM(oi.quantity) ELSE 0 END as "avgPrice"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o.id
      INNER JOIN "Product" p ON oi."productId" = p.id
      WHERE o."createdAt" >= ${range.startDate}
        AND o."createdAt" <= ${range.endDate}
        AND o."paymentStatus" = 'PAID'
      GROUP BY p.id, p.name
      ORDER BY "unitsSold" DESC
      LIMIT 10
    `,

    prisma.$queryRaw<Array<{ categoryName: string; revenue: number; orderCount: bigint }>>`
      SELECT
        c.name as "categoryName",
        COALESCE(SUM(oi."totalPrice"), 0) as revenue,
        COUNT(DISTINCT o.id) as "orderCount"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o.id
      INNER JOIN "Product" p ON oi."productId" = p.id
      INNER JOIN "_CategoryToProduct" cp ON p.id = cp."B"
      INNER JOIN "Category" c ON cp."A" = c.id
      WHERE o."paymentStatus" = 'PAID'
        AND o."createdAt" >= ${range.startDate}
        AND o."createdAt" <= ${range.endDate}
      GROUP BY c.name
      ORDER BY revenue DESC
    `,

    previousRange ? prisma.order.count({ where: { createdAt: { gte: previousRange.startDate, lte: previousRange.endDate } } }) : null,
    previousRange ? prisma.order.count({ where: { createdAt: { gte: previousRange.startDate, lte: previousRange.endDate }, paymentStatus: "PAID" } }) : null,
  ])

  const totalOrders = totalOrdersResult
  const paidOrders = paidOrdersResult
  const totalItems = avgItemsResult._sum.quantity ?? 0
  const avgItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0
  const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0

  // Orders over time
  const orderPoints = allOrders.map((o) => ({ date: o.createdAt, value: 1 }))
  const grouped = groupByGranularity(orderPoints, granularity)

  const ordersOverTime: ComparisonTrendPoint[] = grouped.map((point) => ({
    ...point,
  }))

  const orderStatusDistribution: StatusCount[] = ordersByStatus.map((s) => ({
    status: s.status,
    count: s._count._all,
    percentage: totalOrders > 0 ? (s._count._all / totalOrders) * 100 : 0,
  }))

  const paymentStatusDistribution: StatusCount[] = ordersByPaymentStatus.map((s) => ({
    status: s.paymentStatus,
    count: s._count._all,
    percentage: totalOrders > 0 ? (s._count._all / totalOrders) * 100 : 0,
  }))

  const topSellingProducts: TopSellingProduct[] = topProducts.map((p, i) => ({
    rank: i + 1,
    productId: p.productId,
    productName: p.productName,
    unitsSold: Number(p.unitsSold),
    revenue: Number(p.revenue),
    avgUnitPrice: Number(p.avgPrice),
  }))

  const totalCatRevenue = salesByCategory.reduce((sum, c) => sum + Number(c.revenue), 0)
  const salesByCategoryResult: CategoryRevenue[] = salesByCategory.map((c) => ({
    categoryName: c.categoryName,
    revenue: Number(c.revenue),
    orderCount: Number(c.orderCount),
    percentOfTotal: totalCatRevenue > 0 ? (Number(c.revenue) / totalCatRevenue) * 100 : 0,
  }))

  return {
    totalOrders,
    paidOrders,
    avgItemsPerOrder,
    conversionRate,
    ordersOverTime,
    orderStatusDistribution,
    paymentStatusDistribution,
    topSellingProducts,
    salesByCategory: salesByCategoryResult,
    comparison: previousTotal !== null && previousPaid !== null
      ? { totalOrders: previousTotal, paidOrders: previousPaid }
      : undefined,
  }
}

// ============================================
// FINANCIAL SUMMARY
// ============================================

export async function getFinancialSummary(
  range: DateRange,
  previousRange?: DateRange,
  granularity: "daily" | "weekly" | "monthly" = "monthly"
): Promise<FinancialOverview & { comparison?: { grossRevenue: number; totalDiscounts: number; netRevenue: number; shippingRevenue: number } }> {
  const where = {
    paymentStatus: "PAID",
    createdAt: { gte: range.startDate, lte: range.endDate },
  }

  const [
    aggregate,
    orders,
    couponOrders,
    bespokeOrders,
    unpaidOrders,
    previousAggregate,
  ] = await Promise.all([
    prisma.order.aggregate({
      where,
      _sum: { subtotal: true, shippingCost: true, discountTotal: true, total: true },
    }),

    prisma.order.findMany({
      where,
      select: { createdAt: true, subtotal: true, shippingCost: true, discountTotal: true },
    }),

    prisma.order.findMany({
      where: {
        ...where,
        couponCode: { not: null },
      },
      select: { couponCode: true, couponDiscount: true, total: true },
    }),

    prisma.bespokeOrder.findMany({
      where: {
        createdAt: { gte: range.startDate, lte: range.endDate },
      },
      select: {
        orderNumber: true,
        customerName: true,
        status: true,
        estimatedPrice: true,
        finalPrice: true,
        depositAmount: true,
        depositPaid: true,
      },
    }),

    prisma.order.findMany({
      where: {
        paymentStatus: { in: ["UNPAID", "PENDING"] },
        createdAt: { gte: range.startDate, lte: range.endDate },
      },
      select: {
        orderNumber: true,
        customerEmail: true,
        total: true,
        placedAt: true,
        status: true,
      },
      orderBy: { placedAt: "desc" },
      take: 20,
    }),

    previousRange
      ? prisma.order.aggregate({
          where: {
            paymentStatus: "PAID",
            createdAt: { gte: previousRange.startDate, lte: previousRange.endDate },
          },
          _sum: { subtotal: true, shippingCost: true, discountTotal: true, total: true },
        })
      : null,
  ])

  const grossRevenue = aggregate._sum.subtotal ?? 0
  const totalDiscounts = aggregate._sum.discountTotal ?? 0
  const shippingRevenue = aggregate._sum.shippingCost ?? 0
  const netRevenue = grossRevenue - totalDiscounts

  // Revenue composition over time
  const compositionPoints = orders.map((o) => ({
    date: o.createdAt,
    net: (o.subtotal ?? 0) - (o.discountTotal ?? 0),
    discounts: o.discountTotal ?? 0,
    shipping: o.shippingCost ?? 0,
  }))

  const compositionMap = new Map<string, { net: number; discounts: number; shipping: number }>()
  for (const p of compositionPoints) {
    const d = new Date(p.date)
    let key: string
    if (granularity === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    } else if (granularity === "weekly") {
      const startOfWeek = new Date(d)
      startOfWeek.setDate(d.getDate() - d.getDay())
      key = startOfWeek.toISOString().split("T")[0]
    } else {
      key = d.toISOString().split("T")[0]
    }

    const existing = compositionMap.get(key) || { net: 0, discounts: 0, shipping: 0 }
    existing.net += p.net
    existing.discounts += p.discounts
    existing.shipping += p.shipping
    compositionMap.set(key, existing)
  }

  const revenueComposition: RevenueCompositionPoint[] = Array.from(compositionMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Coupon impact
  const couponMap = new Map<string, { count: number; totalDiscount: number; totalRevenue: number }>()
  for (const o of couponOrders) {
    if (!o.couponCode) continue
    const existing = couponMap.get(o.couponCode) || { count: 0, totalDiscount: 0, totalRevenue: 0 }
    existing.count += 1
    existing.totalDiscount += o.couponDiscount ?? 0
    existing.totalRevenue += o.total
    couponMap.set(o.couponCode, existing)
  }

  const couponImpact: CouponImpact[] = Array.from(couponMap.entries())
    .map(([code, data]) => ({
      code,
      timesUsed: data.count,
      totalDiscount: data.totalDiscount,
      revenueGenerated: data.totalRevenue,
      avgDiscountPerOrder: data.count > 0 ? data.totalDiscount / data.count : 0,
    }))
    .sort((a, b) => b.totalDiscount - a.totalDiscount)

  // Bespoke summary
  const completedBespoke = bespokeOrders.filter((b) => b.status === "COMPLETED" || b.status === "DELIVERED")
  const bespokeSummary = {
    totalEstimates: bespokeOrders.reduce((sum, b) => sum + (b.estimatedPrice ?? 0), 0),
    totalDeposits: bespokeOrders.reduce((sum, b) => sum + (b.depositPaid ? (b.depositAmount ?? 0) : 0), 0),
    totalFinalRevenue: completedBespoke.reduce((sum, b) => sum + (b.finalPrice ?? b.estimatedPrice ?? 0), 0),
    orderCount: bespokeOrders.length,
    completionRate: bespokeOrders.length > 0 ? (completedBespoke.length / bespokeOrders.length) * 100 : 0,
  }

  // Outstanding balances
  const outstandingOrdersList: OutstandingOrder[] = unpaidOrders.map((o) => ({
    orderNumber: o.orderNumber,
    customerEmail: o.customerEmail,
    total: o.total,
    placedAt: o.placedAt,
    status: o.status,
  }))

  const bespokeBalances: OutstandingBespoke[] = bespokeOrders
    .filter((b) => b.status !== "COMPLETED" && b.status !== "DELIVERED" && b.status !== "CANCELLED")
    .map((b) => {
      const total = b.finalPrice ?? b.estimatedPrice ?? 0
      const paid = b.depositPaid ? (b.depositAmount ?? 0) : 0
      return {
        orderNumber: b.orderNumber,
        customerName: b.customerName,
        estimatedPrice: b.estimatedPrice,
        depositAmount: b.depositAmount,
        depositPaid: b.depositPaid,
        balanceDue: total - paid,
        status: b.status,
      }
    })
    .filter((b) => b.balanceDue > 0)

  return {
    grossRevenue,
    totalDiscounts,
    netRevenue,
    shippingRevenue,
    revenueComposition,
    couponImpact,
    bespokeSummary,
    outstandingBalances: {
      unpaidOrders: outstandingOrdersList,
      bespokeBalances,
      totalUnpaid: outstandingOrdersList.reduce((sum, o) => sum + o.total, 0),
      totalBespokeOwed: bespokeBalances.reduce((sum, b) => sum + b.balanceDue, 0),
    },
    comparison: previousAggregate
      ? {
          grossRevenue: previousAggregate._sum.subtotal ?? 0,
          totalDiscounts: previousAggregate._sum.discountTotal ?? 0,
          netRevenue: (previousAggregate._sum.subtotal ?? 0) - (previousAggregate._sum.discountTotal ?? 0),
          shippingRevenue: previousAggregate._sum.shippingCost ?? 0,
        }
      : undefined,
  }
}

// ============================================
// CUSTOMER REVENUE
// ============================================

export async function getCustomerRevenue(
  range: DateRange,
  previousRange?: DateRange
): Promise<CustomerRevenueOverview & { comparison?: { avgClv: number; newCustomerCount: number } }> {
  const where = {
    paymentStatus: "PAID",
    createdAt: { gte: range.startDate, lte: range.endDate },
  }

  const [
    customerOrders,
    newCustomers,
    allCustomersInRange,
    previousNewCustomers,
  ] = await Promise.all([
    // Group orders by customer
    prisma.order.groupBy({
      by: ["userId"],
      where: { ...where, userId: { not: null } },
      _sum: { total: true },
      _count: { _all: true },
    }),

    // Customers who made their first order in this period
    prisma.$queryRaw<Array<{ userId: string; firstOrderDate: Date }>>`
      SELECT "userId", MIN("createdAt") as "firstOrderDate"
      FROM "Order"
      WHERE "paymentStatus" = 'PAID' AND "userId" IS NOT NULL
      GROUP BY "userId"
      HAVING MIN("createdAt") >= ${range.startDate}
        AND MIN("createdAt") <= ${range.endDate}
    `,

    // All customers with orders in range + their user info
    prisma.order.findMany({
      where: { ...where, userId: { not: null } },
      select: {
        userId: true,
        total: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    previousRange
      ? prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT sub."userId") as count
          FROM (
            SELECT "userId", MIN("createdAt") as "firstOrderDate"
            FROM "Order"
            WHERE "paymentStatus" = 'PAID' AND "userId" IS NOT NULL
            GROUP BY "userId"
            HAVING MIN("createdAt") >= ${previousRange.startDate}
              AND MIN("createdAt") <= ${previousRange.endDate}
          ) sub
        `
      : null,
  ])

  // CLV calculations
  const clvValues = customerOrders
    .map((c) => c._sum.total ?? 0)
    .sort((a, b) => a - b)

  const totalSpend = clvValues.reduce((sum, v) => sum + v, 0)
  const avgClv = clvValues.length > 0 ? totalSpend / clvValues.length : 0
  const medianClv =
    clvValues.length > 0
      ? clvValues.length % 2 === 0
        ? (clvValues[clvValues.length / 2 - 1] + clvValues[clvValues.length / 2]) / 2
        : clvValues[Math.floor(clvValues.length / 2)]
      : 0

  // New vs returning
  const newCustomerIds = new Set(newCustomers.map((c) => c.userId))
  const newRevenue = customerOrders
    .filter((c) => c.userId && newCustomerIds.has(c.userId))
    .reduce((sum, c) => sum + (c._sum.total ?? 0), 0)
  const returningRevenue = totalSpend - newRevenue
  const returningRevenuePercent = totalSpend > 0 ? (returningRevenue / totalSpend) * 100 : 0

  // Customer acquisition trend (monthly)
  const acquisitionMap = new Map<string, number>()
  for (const c of newCustomers) {
    const d = new Date(c.firstOrderDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    acquisitionMap.set(key, (acquisitionMap.get(key) || 0) + 1)
  }
  const customerAcquisitionTrend: TrendPoint[] = Array.from(acquisitionMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Top customers
  const customerMap = new Map<string, { name: string; email: string; orderCount: number; totalSpent: number; lastOrderDate: Date | null }>()
  for (const order of allCustomersInRange) {
    if (!order.userId) continue
    const existing = customerMap.get(order.userId)
    if (existing) {
      existing.orderCount += 1
      existing.totalSpent += order.total
      if (!existing.lastOrderDate || order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt
      }
    } else {
      customerMap.set(order.userId, {
        name: order.user?.name ?? "Unknown",
        email: order.user?.email ?? "",
        orderCount: 1,
        totalSpent: order.total,
        lastOrderDate: order.createdAt,
      })
    }
  }

  const topCustomers: TopCustomer[] = Array.from(customerMap.entries())
    .map(([userId, data]) => ({
      rank: 0,
      userId,
      ...data,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 20)
    .map((c, i) => ({ ...c, rank: i + 1 }))

  // Previous period comparison
  const previousAvgClv = previousRange
    ? await prisma.order
        .groupBy({
          by: ["userId"],
          where: {
            paymentStatus: "PAID",
            userId: { not: null },
            createdAt: { gte: previousRange.startDate, lte: previousRange.endDate },
          },
          _sum: { total: true },
        })
        .then((results) => {
          const vals = results.map((r) => r._sum.total ?? 0)
          return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
        })
    : undefined

  return {
    avgClv,
    medianClv,
    newCustomerCount: newCustomers.length,
    returningRevenuePercent,
    newVsReturningRevenue: {
      newRevenue,
      returningRevenue,
    },
    customerAcquisitionTrend,
    topCustomers,
    comparison:
      previousAvgClv !== undefined && previousNewCustomers
        ? {
            avgClv: previousAvgClv,
            newCustomerCount: Number(previousNewCustomers[0]?.count ?? 0),
          }
        : undefined,
  }
}

// ============================================
// EXPORT: CHANGE PERCENT UTILITY
// ============================================

export { calculateChangePercent }
