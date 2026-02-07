"use client"

import { useState, useTransition } from "react"
import { Star, CheckCircle, XCircle, Trash2, AlertCircle } from "lucide-react"
import { moderateReview, deleteReview } from "./actions"
import { formatDate } from "@/lib/utils"

interface ReviewUser {
    id: string
    name: string
    email: string
}

interface ReviewProduct {
    id: string
    name: string
    slug: string
}

interface ReviewItem {
    id: string
    productId: string
    userId: string
    rating: number
    title: string | null
    comment: string | null
    status: "PENDING" | "APPROVED" | "REJECTED"
    createdAt: string
    updatedAt: string
    product: ReviewProduct
    user: ReviewUser
}

interface ReviewsClientProps {
    reviews: ReviewItem[]
    currentStatus: string | undefined
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
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

export default function ReviewsClient({ reviews, currentStatus }: ReviewsClientProps) {
    const [isPending, startTransition] = useTransition()
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    function handleModerate(id: string, status: "APPROVED" | "REJECTED") {
        setActionMessage(null)
        startTransition(async () => {
            const result = await moderateReview(id, status)
            if (result.error) {
                setActionMessage({ type: "error", text: result.error })
            } else {
                setActionMessage({
                    type: "success",
                    text: `Review ${status.toLowerCase()} successfully`,
                })
            }
        })
    }

    function handleDelete(id: string) {
        if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
            return
        }

        setActionMessage(null)
        startTransition(async () => {
            const result = await deleteReview(id)
            if (result.error) {
                setActionMessage({ type: "error", text: result.error })
            } else {
                setActionMessage({ type: "success", text: "Review deleted successfully" })
            }
        })
    }

    const statusFilters = [
        { label: "All", value: "" },
        { label: "Pending", value: "PENDING" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
    ] as const

    return (
        <>
            {/* Status Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {statusFilters.map((filter) => {
                    const isActive = (currentStatus || "") === filter.value
                    return (
                        <a
                            key={filter.value}
                            href={
                                filter.value
                                    ? `/admin/reviews?status=${filter.value}`
                                    : "/admin/reviews"
                            }
                            className={`px-4 py-2 text-sm font-medium rounded-sm border transition-colors min-h-[48px] flex items-center ${
                                isActive
                                    ? "bg-obsidian-900 text-white border-obsidian-900"
                                    : "bg-white text-obsidian-600 border-obsidian-200 hover:bg-obsidian-50 hover:text-obsidian-900"
                            }`}
                        >
                            {filter.label}
                        </a>
                    )
                })}
            </div>

            {/* Action Messages */}
            {actionMessage && (
                <div
                    className={`mb-4 px-4 py-3 rounded-sm text-sm flex items-center gap-2 ${
                        actionMessage.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                    role="alert"
                >
                    {actionMessage.type === "success" ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {actionMessage.text}
                </div>
            )}

            {/* Reviews Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Product</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Rating</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Review</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Date</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-obsidian-500">
                                        No reviews found.
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-obsidian-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-obsidian-900 truncate max-w-[180px]">
                                                {review.product.name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-obsidian-900">
                                                    {review.user.name}
                                                </span>
                                                <span className="text-xs text-obsidian-500">
                                                    {review.user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StarRating rating={review.rating} />
                                        </td>
                                        <td className="px-6 py-4 max-w-[250px]">
                                            {review.title && (
                                                <p className="font-medium text-obsidian-900 truncate">
                                                    {review.title}
                                                </p>
                                            )}
                                            {review.comment && (
                                                <p className="text-obsidian-500 text-xs mt-0.5 truncate">
                                                    {review.comment}
                                                </p>
                                            )}
                                            {!review.title && !review.comment && (
                                                <span className="text-obsidian-400 italic text-xs">
                                                    No text
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                                    review.status
                                                )}`}
                                            >
                                                {review.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap">
                                            {formatDate(review.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {review.status !== "APPROVED" && (
                                                    <button
                                                        onClick={() => handleModerate(review.id, "APPROVED")}
                                                        disabled={isPending}
                                                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                                                        aria-label={`Approve review by ${review.user.name}`}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {review.status !== "REJECTED" && (
                                                    <button
                                                        onClick={() => handleModerate(review.id, "REJECTED")}
                                                        disabled={isPending}
                                                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-sm text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                                                        aria-label={`Reject review by ${review.user.name}`}
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    aria-label={`Delete review by ${review.user.name}`}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
