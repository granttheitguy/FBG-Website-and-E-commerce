// ============================================
// ACCOUNTING DASHBOARD TYPES
// ============================================

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface ComparisonPeriod {
  current: DateRange
  previous: DateRange
}

export interface TrendPoint {
  date: string
  value: number
}

export interface ComparisonTrendPoint extends TrendPoint {
  previousValue?: number
}

export interface StatCardData {
  label: string
  value: string
  previousValue?: string
  changePercent?: number
  icon?: string
}

// ---- Revenue Types ----

export interface RevenueOverview {
  totalRevenue: number
  netRevenue: number
  avgOrderValue: number
  totalOrders: number
  revenueOverTime: ComparisonTrendPoint[]
  revenueBreakdown: {
    gross: number
    discounts: number
    shipping: number
    net: number
  }
  topCategories: CategoryRevenue[]
  topProducts: ProductRevenue[]
}

export interface CategoryRevenue {
  categoryName: string
  revenue: number
  orderCount: number
  percentOfTotal: number
}

export interface ProductRevenue {
  productId: string
  productName: string
  categoryName: string | null
  unitsSold: number
  revenue: number
  percentOfTotal: number
}

// ---- Sales Types ----

export interface SalesOverview {
  totalOrders: number
  paidOrders: number
  avgItemsPerOrder: number
  conversionRate: number
  ordersOverTime: ComparisonTrendPoint[]
  orderStatusDistribution: StatusCount[]
  paymentStatusDistribution: StatusCount[]
  topSellingProducts: TopSellingProduct[]
  salesByCategory: CategoryRevenue[]
}

export interface StatusCount {
  status: string
  count: number
  percentage: number
}

export interface TopSellingProduct {
  rank: number
  productId: string
  productName: string
  unitsSold: number
  revenue: number
  avgUnitPrice: number
}

// ---- Financial Types ----

export interface FinancialOverview {
  grossRevenue: number
  totalDiscounts: number
  netRevenue: number
  shippingRevenue: number
  revenueComposition: RevenueCompositionPoint[]
  couponImpact: CouponImpact[]
  bespokeSummary: BespokeSummary
  outstandingBalances: {
    unpaidOrders: OutstandingOrder[]
    bespokeBalances: OutstandingBespoke[]
    totalUnpaid: number
    totalBespokeOwed: number
  }
}

export interface RevenueCompositionPoint {
  date: string
  net: number
  discounts: number
  shipping: number
}

export interface CouponImpact {
  code: string
  timesUsed: number
  totalDiscount: number
  revenueGenerated: number
  avgDiscountPerOrder: number
}

export interface BespokeSummary {
  totalEstimates: number
  totalDeposits: number
  totalFinalRevenue: number
  orderCount: number
  completionRate: number
}

export interface OutstandingOrder {
  orderNumber: string
  customerEmail: string | null
  total: number
  placedAt: Date
  status: string
}

export interface OutstandingBespoke {
  orderNumber: string
  customerName: string
  estimatedPrice: number | null
  depositAmount: number | null
  depositPaid: boolean
  balanceDue: number
  status: string
}

// ---- Customer Revenue Types ----

export interface CustomerRevenueOverview {
  avgClv: number
  medianClv: number
  newCustomerCount: number
  returningRevenuePercent: number
  newVsReturningRevenue: {
    newRevenue: number
    returningRevenue: number
  }
  customerAcquisitionTrend: TrendPoint[]
  topCustomers: TopCustomer[]
}

export interface TopCustomer {
  rank: number
  userId: string
  name: string
  email: string
  orderCount: number
  totalSpent: number
  lastOrderDate: Date | null
}

// ---- Date Preset ----

export type DatePreset = "7d" | "30d" | "90d" | "ytd" | "1y" | "all"

export interface AccountingSearchParams {
  startDate?: string
  endDate?: string
  preset?: DatePreset
  compare?: string
  granularity?: "daily" | "weekly" | "monthly"
}
