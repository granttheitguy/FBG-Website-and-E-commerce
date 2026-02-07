import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"
import ProductCard from "@/components/features/shop/ProductCard"
import FilterSidebarWrapper from "@/components/features/shop/FilterSidebarWrapper"
import SortDropdown from "@/components/features/shop/SortDropdown"
import Pagination from "@/components/features/shop/Pagination"
import { prisma } from "@/lib/db"
import { shopFilterSchema } from "@/lib/validation-schemas"
import Link from "next/link"
import { Suspense } from "react"
import type { Prisma } from "@prisma/client"
import type { Metadata } from "next"

export const revalidate = 300

const PRODUCTS_PER_PAGE = 12

export const metadata: Metadata = {
    title: "Shop | Fashion By Grant",
    description: "Explore our curated collection of bespoke African luxury wear and contemporary essentials.",
}

interface ShopPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Builds a Prisma where clause from validated filter params.
 */
function buildWhereClause(filters: {
    category?: string
    priceMin?: number
    priceMax?: number
    q?: string
}): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
        status: "ACTIVE",
    }

    // Category filter: filter by Category.slug via product.categories relationship
    if (filters.category) {
        where.categories = {
            some: {
                slug: filters.category,
            },
        }
    }

    // Price range filters
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        where.basePrice = {}
        if (filters.priceMin !== undefined) {
            where.basePrice.gte = filters.priceMin
        }
        if (filters.priceMax !== undefined) {
            where.basePrice.lte = filters.priceMax
        }
    }

    // Search query: search Product.name with contains (SQLite LIKE is case-insensitive for ASCII)
    if (filters.q) {
        where.OR = [
            { name: { contains: filters.q } },
            { descriptionShort: { contains: filters.q } },
        ]
    }

    return where
}

/**
 * Builds a Prisma orderBy clause from the sort parameter.
 */
function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
        case "price-asc":
            return { basePrice: "asc" }
        case "price-desc":
            return { basePrice: "desc" }
        case "newest":
        default:
            return { createdAt: "desc" }
    }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
    // Await searchParams (Next.js 16 makes searchParams a Promise)
    const rawParams = await searchParams

    // Flatten to single values (take first value if array)
    const flatParams: Record<string, string | undefined> = {}
    for (const [key, value] of Object.entries(rawParams)) {
        flatParams[key] = Array.isArray(value) ? value[0] : value
    }

    // Parse and validate with Zod schema
    const parsed = shopFilterSchema.safeParse(flatParams)
    const filters = parsed.success
        ? parsed.data
        : { page: 1, limit: PRODUCTS_PER_PAGE }

    const page = filters.page ?? 1
    const limit = filters.limit ?? PRODUCTS_PER_PAGE
    const sort = "sort" in filters ? filters.sort : undefined
    const skip = (page - 1) * limit

    // Build query
    const where = buildWhereClause({
        category: "category" in filters ? filters.category : undefined,
        priceMin: "priceMin" in filters ? filters.priceMin : undefined,
        priceMax: "priceMax" in filters ? filters.priceMax : undefined,
        q: "q" in filters ? filters.q : undefined,
    })
    const orderBy = buildOrderBy(sort)

    // Fetch products + total count + categories in parallel
    const [products, totalCount, categories] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                images: { take: 2, orderBy: { sortOrder: "asc" } },
                variants: { where: { status: "ACTIVE" }, take: 5 },
                categories: { select: { name: true } },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma.product.count({ where }),
        prisma.category.findMany({
            orderBy: { name: "asc" },
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalCount / limit))
    const showingStart = totalCount === 0 ? 0 : skip + 1
    const showingEnd = Math.min(skip + limit, totalCount)

    // Derive page title from active filters
    const activeCategory = "category" in filters ? filters.category : undefined
    const searchQuery = "q" in filters ? filters.q : undefined
    const categoryName = activeCategory
        ? categories.find(c => c.slug === activeCategory)?.name
        : undefined

    let pageTitle = "All Products"
    if (searchQuery) {
        pageTitle = `Results for "${searchQuery}"`
    } else if (categoryName) {
        pageTitle = categoryName
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main id="main-content">
                {/* Breadcrumbs & Header */}
                <div className="bg-surface-secondary border-b border-obsidian-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <nav className="flex items-center gap-2 text-xs text-obsidian-500 mb-4" aria-label="Breadcrumb">
                            <Link href="/" className="hover:text-obsidian-900 transition-colors">Home</Link>
                            <span className="text-obsidian-400" aria-hidden="true">/</span>
                            {categoryName ? (
                                <>
                                    <Link href="/shop" className="hover:text-obsidian-900 transition-colors">Shop</Link>
                                    <span className="text-obsidian-400" aria-hidden="true">/</span>
                                    <span className="text-obsidian-900">{categoryName}</span>
                                </>
                            ) : (
                                <span className="text-obsidian-900">Shop</span>
                            )}
                        </nav>
                        <h1
                            className="text-3xl sm:text-[40px] font-bold text-obsidian-900 font-serif"
                            style={{ letterSpacing: "-0.02em" }}
                        >
                            {pageTitle}
                        </h1>
                        <p className="text-obsidian-600 mt-2 max-w-2xl text-sm sm:text-base">
                            {searchQuery
                                ? `Found ${totalCount} product${totalCount !== 1 ? "s" : ""} matching your search.`
                                : "Explore our curated collection of bespoke African luxury wear and contemporary essentials."
                            }
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Filters */}
                        <div className="w-full lg:w-64 flex-shrink-0">
                            <Suspense fallback={null}>
                                <FilterSidebarWrapper categories={categories} />
                            </Suspense>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-obsidian-100">
                                <p className="text-sm text-obsidian-600">
                                    {totalCount === 0 ? (
                                        "No results"
                                    ) : (
                                        <>
                                            Showing{" "}
                                            <span className="font-medium text-obsidian-900 font-tabular">
                                                {showingStart}-{showingEnd}
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-medium text-obsidian-900 font-tabular">
                                                {totalCount}
                                            </span>{" "}
                                            result{totalCount !== 1 ? "s" : ""}
                                        </>
                                    )}
                                </p>

                                <div className="flex items-center gap-4">
                                    <Suspense fallback={null}>
                                        <SortDropdown currentSort={sort ?? "newest"} />
                                    </Suspense>
                                </div>
                            </div>

                            {/* Product Grid */}
                            {products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={{
                                                ...product,
                                                category: product.categories[0] ?? null,
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-surface-secondary rounded-sm">
                                    <p className="text-obsidian-500 mb-2">
                                        No products found matching your criteria.
                                    </p>
                                    {searchQuery && (
                                        <p className="text-sm text-obsidian-400 mb-4">
                                            Try a different search term or adjust your filters.
                                        </p>
                                    )}
                                    <Link
                                        href="/shop"
                                        className="inline-block mt-2 text-sm font-medium text-obsidian-900 underline underline-offset-4 hover:text-gold-600 transition-colors min-h-[44px] py-2"
                                    >
                                        Clear all filters
                                    </Link>
                                </div>
                            )}

                            {/* Pagination */}
                            {products.length > 0 && (
                                <Suspense fallback={null}>
                                    <Pagination currentPage={page} totalPages={totalPages} />
                                </Suspense>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
