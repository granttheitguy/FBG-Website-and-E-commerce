import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Star, MessageSquareText } from "lucide-react"

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${
                        i <= rating
                            ? "fill-gold-500 text-gold-500"
                            : "fill-obsidian-200 text-obsidian-200"
                    }`}
                />
            ))}
        </div>
    )
}

function getStatusBadge(status: string) {
    switch (status) {
        case "PENDING":
            return "bg-yellow-100 text-yellow-800"
        case "APPROVED":
            return "bg-green-100 text-green-800"
        case "REJECTED":
            return "bg-red-100 text-red-800"
        default:
            return "bg-obsidian-100 text-obsidian-800"
    }
}

export default async function CustomerReviewsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const reviews = await prisma.review.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: {
                        select: { imageUrl: true },
                        take: 1,
                        orderBy: { sortOrder: "asc" },
                    },
                },
            },
        },
    })

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-medium text-obsidian-900 mb-8 font-serif tracking-[-0.02em]">
                My Reviews
            </h1>

            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-obsidian-50 rounded-sm border border-obsidian-100">
                        <MessageSquareText className="w-12 h-12 text-obsidian-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-obsidian-900">
                            No reviews yet
                        </h3>
                        <p className="text-obsidian-500 mb-6">
                            You have not reviewed any products yet.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800 transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-white border border-obsidian-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* Product Image */}
                                    <Link
                                        href={`/shop/${review.product.slug}`}
                                        className="w-16 h-20 bg-obsidian-100 rounded-sm overflow-hidden flex-shrink-0"
                                    >
                                        {review.product.images[0] ? (
                                            <img
                                                src={review.product.images[0].imageUrl}
                                                alt={review.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-obsidian-400">
                                                <MessageSquareText className="w-6 h-6" />
                                            </div>
                                        )}
                                    </Link>

                                    {/* Review Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <Link
                                                    href={`/shop/${review.product.slug}`}
                                                    className="font-medium text-obsidian-900 hover:text-obsidian-600 transition-colors"
                                                >
                                                    {review.product.name}
                                                </Link>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <StarRating rating={review.rating} />
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                                            review.status
                                                        )}`}
                                                    >
                                                        {review.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-obsidian-500 whitespace-nowrap">
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>

                                        {review.title && (
                                            <p className="font-medium text-obsidian-900 mt-3">
                                                {review.title}
                                            </p>
                                        )}
                                        {review.comment && (
                                            <p className="text-obsidian-600 text-sm mt-1">
                                                {review.comment}
                                            </p>
                                        )}

                                        {review.status === "PENDING" && (
                                            <p className="text-xs text-obsidian-400 mt-3">
                                                Your review is awaiting moderation.
                                            </p>
                                        )}
                                        {review.status === "REJECTED" && (
                                            <p className="text-xs text-red-600 mt-3">
                                                This review did not meet our guidelines.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
