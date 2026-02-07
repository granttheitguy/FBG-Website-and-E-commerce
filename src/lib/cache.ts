import { unstable_cache } from "next/cache"
import { prisma } from "./db"

export const CACHE_TAGS = {
    PRODUCTS: "products",
    CATEGORIES: "categories",
    DASHBOARD_STATS: "dashboard-stats",
    ORDERS: "orders",
} as const

export const CACHE_REVALIDATE = {
    PRODUCTS: 5 * 60, // 5 minutes
    CATEGORIES: 15 * 60, // 15 minutes
    DASHBOARD_STATS: 60, // 1 minute
    ORDERS: 2 * 60, // 2 minutes
} as const

/**
 * Cached function to get active products
 */
export const getCachedProducts = unstable_cache(
    async (options?: { limit?: number; featured?: boolean }) => {
        const where: any = { status: "ACTIVE" }
        if (options?.featured) {
            where.isFeatured = true
        }

        return await prisma.product.findMany({
            where,
            include: {
                images: { take: 1, orderBy: { sortOrder: "asc" } },
                variants: { where: { status: "ACTIVE" }, take: 5 }
            },
            orderBy: { createdAt: "desc" },
            take: options?.limit || 50
        })
    },
    ["products-list"],
    {
        revalidate: CACHE_REVALIDATE.PRODUCTS,
        tags: [CACHE_TAGS.PRODUCTS]
    }
)

/**
 * Cached function to get categories
 */
export const getCachedCategories = unstable_cache(
    async () => {
        return await prisma.category.findMany({
            orderBy: { name: "asc" }
        })
    },
    ["categories-list"],
    {
        revalidate: CACHE_REVALIDATE.CATEGORIES,
        tags: [CACHE_TAGS.CATEGORIES]
    }
)

/**
 * Cached function to get dashboard stats
 */
export const getCachedDashboardStats = unstable_cache(
    async () => {
        const [totalSalesRaw, totalOrders, totalProducts, totalCustomers] = await Promise.all([
            prisma.order.aggregate({
                where: { paymentStatus: "PAID" },
                _sum: { total: true }
            }),
            prisma.order.count(),
            prisma.product.count({ where: { status: "ACTIVE" } }),
            prisma.user.count({ where: { role: "CUSTOMER" } })
        ])

        return {
            totalSales: totalSalesRaw._sum.total || 0,
            totalOrders,
            totalProducts,
            totalCustomers
        }
    },
    ["dashboard-stats"],
    {
        revalidate: CACHE_REVALIDATE.DASHBOARD_STATS,
        tags: [CACHE_TAGS.DASHBOARD_STATS]
    }
)
