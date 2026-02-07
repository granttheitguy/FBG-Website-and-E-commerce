import { prisma } from "@/lib/db"
import { Star } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ReviewSectionProps {
    productId: string
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
    const sizeClass = size === "md" ? "w-5 h-5" : "w-4 h-4"
    return (
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`${sizeClass} ${
                        i <= rating
                            ? "fill-gold-500 text-gold-500"
                            : "fill-obsidian-200 text-obsidian-200"
                    }`}
                />
            ))}
        </div>
    )
}

function StarDistributionBar({
    starCount,
    total,
    starNumber,
}: {
    starCount: number
    total: number
    starNumber: number
}) {
    const percentage = total > 0 ? (starCount / total) * 100 : 0

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="w-8 text-obsidian-600 text-right">{starNumber}</span>
            <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500 flex-shrink-0" />
            <div className="flex-1 h-2 bg-obsidian-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gold-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="w-8 text-obsidian-500 text-xs">{starCount}</span>
        </div>
    )
}

export default async function ReviewSection({ productId }: ReviewSectionProps) {
    const reviews = await prisma.review.findMany({
        where: {
            productId,
            status: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: { name: true },
            },
        },
    })

    const totalReviews = reviews.length
    const averageRating =
        totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0

    // Calculate star distribution
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
    }))

    if (totalReviews === 0) {
        return (
            <section aria-labelledby="reviews-heading">
                <h2
                    id="reviews-heading"
                    className="text-xl font-serif font-bold tracking-[-0.02em] text-obsidian-900 mb-4"
                >
                    Customer Reviews
                </h2>
                <div className="bg-surface-secondary rounded-sm border border-obsidian-100 p-8 text-center">
                    <p className="text-obsidian-500">No reviews yet for this product.</p>
                </div>
            </section>
        )
    }

    return (
        <section aria-labelledby="reviews-heading">
            <h2
                id="reviews-heading"
                className="text-xl font-serif font-bold tracking-[-0.02em] text-obsidian-900 mb-6"
            >
                Customer Reviews
            </h2>

            {/* Summary */}
            <div className="bg-white rounded-sm border border-obsidian-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-8">
                    {/* Average Rating */}
                    <div className="flex flex-col items-center sm:items-start">
                        <span className="text-4xl font-bold text-obsidian-900 font-tabular">
                            {averageRating.toFixed(1)}
                        </span>
                        <StarRating rating={Math.round(averageRating)} size="md" />
                        <span className="text-sm text-obsidian-500 mt-1">
                            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                        </span>
                    </div>

                    {/* Star Distribution */}
                    <div className="flex-1 space-y-1.5 max-w-sm">
                        {distribution.map((d) => (
                            <StarDistributionBar
                                key={d.star}
                                starNumber={d.star}
                                starCount={d.count}
                                total={totalReviews}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <article
                        key={review.id}
                        className="bg-white rounded-sm border border-obsidian-200 p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-obsidian-200 flex items-center justify-center text-obsidian-600 font-medium text-sm">
                                        {review.user.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="font-medium text-obsidian-900 text-sm">
                                            {review.user.name}
                                        </p>
                                        <p className="text-xs text-obsidian-500">
                                            {formatDate(review.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <StarRating rating={review.rating} />
                        </div>

                        {review.title && (
                            <h3 className="font-medium text-obsidian-900 mt-4">
                                {review.title}
                            </h3>
                        )}
                        {review.comment && (
                            <p className="text-obsidian-600 text-sm mt-2 leading-relaxed">
                                {review.comment}
                            </p>
                        )}
                    </article>
                ))}
            </div>
        </section>
    )
}
