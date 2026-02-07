import { prisma } from "@/lib/db"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import ProductClient from "@/components/features/shop/ProductClient"
import ProductImageGallery from "@/components/features/shop/ProductImageGallery"
import ReviewSection from "@/components/features/shop/ReviewSection"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: { where: { status: "ACTIVE" } },
            categories: true,
            reviews: {
                where: { status: "APPROVED" },
                select: { rating: true },
            },
        }
    })

    if (!product) {
        notFound()
    }

    // Calculate average rating from real review data
    const totalReviews = product.reviews.length
    const averageRating =
        totalReviews > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0

    // Fetch related products (same category)
    const relatedProducts = await prisma.product.findMany({
        where: {
            categories: { some: { id: product.categories[0]?.id } },
            id: { not: product.id },
            status: "ACTIVE"
        },
        include: { images: true },
        take: 4
    })

    const imageUrls = product.images.map((img) => img.imageUrl)

    return (
        <div className="min-h-screen bg-surface-primary">
            <Header />

            <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-obsidian-500 mb-8">
                    <Link href="/" className="text-obsidian-600 link-underline hover:text-obsidian-900 transition-colors">
                        Home
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link href="/shop" className="text-obsidian-600 link-underline hover:text-obsidian-900 transition-colors">
                        Shop
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-obsidian-900 truncate max-w-[200px]" aria-current="page">
                        {product.name}
                    </span>
                </nav>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Image Gallery with Thumbnails */}
                    <ProductImageGallery
                        images={imageUrls}
                        productName={product.name}
                    />

                    {/* Product Info (Client Component) */}
                    <ProductClient
                        product={product}
                        averageRating={averageRating}
                        totalReviews={totalReviews}
                    />
                </div>

                {/* Reviews Section */}
                <div className="mt-16 border-t border-obsidian-200 pt-12">
                    <Suspense
                        fallback={
                            <div className="space-y-4">
                                <div className="h-8 w-48 bg-obsidian-100 rounded-sm animate-pulse" />
                                <div className="h-32 bg-obsidian-50 rounded-sm animate-pulse" />
                            </div>
                        }
                    >
                        <ReviewSection productId={product.id} />
                    </Suspense>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section
                        aria-labelledby="related-products-heading"
                        className="mt-16 border-t border-obsidian-200 pt-16"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2
                                id="related-products-heading"
                                className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900"
                            >
                                You May Also Like
                            </h2>
                            <Link
                                href="/shop"
                                className="text-sm font-medium text-obsidian-900 hover:text-obsidian-600 flex items-center gap-2 link-underline transition-colors"
                            >
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((related) => (
                                <Link key={related.id} href={`/product/${related.slug}`} className="group">
                                    <div className="aspect-[3/4] bg-obsidian-100 rounded-sm overflow-hidden mb-4">
                                        {related.images[0] && (
                                            <img
                                                src={related.images[0].imageUrl}
                                                alt={related.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        )}
                                    </div>
                                    <h3 className="text-sm font-medium text-obsidian-900 mb-1 group-hover:text-obsidian-600 transition-colors">
                                        {related.name}
                                    </h3>
                                    <p className="text-sm font-medium text-obsidian-900 font-tabular">
                                        {formatCurrency(related.basePrice)}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    )
}
