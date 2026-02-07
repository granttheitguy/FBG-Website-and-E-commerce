"use client"

import { useState } from "react"
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface ReviewFormProps {
    productId: string
    productName: string
    hasSession: boolean
}

export default function ReviewForm({ productId, productName, hasSession }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [title, setTitle] = useState("")
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{
        type: "success" | "error"
        text: string
    } | null>(null)

    if (!hasSession) {
        return (
            <div className="bg-surface-secondary rounded-sm border border-obsidian-100 p-6 text-center">
                <p className="text-obsidian-600 text-sm">
                    <a
                        href="/login"
                        className="font-medium text-obsidian-900 underline hover:text-gold-600 transition-colors"
                    >
                        Sign in
                    </a>{" "}
                    to leave a review for this product.
                </p>
            </div>
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (rating === 0) {
            setMessage({ type: "error", text: "Please select a rating" })
            return
        }

        setIsSubmitting(true)
        setMessage(null)

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    rating,
                    title: title.trim() || undefined,
                    comment: comment.trim() || undefined,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setMessage({
                    type: "error",
                    text: data.error || "Failed to submit review",
                })
                return
            }

            setMessage({
                type: "success",
                text: "Thank you! Your review has been submitted and is awaiting moderation.",
            })
            setRating(0)
            setTitle("")
            setComment("")
        } catch {
            setMessage({
                type: "error",
                text: "Something went wrong. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const displayRating = hoveredRating || rating

    return (
        <div className="bg-white rounded-sm border border-obsidian-200 p-6">
            <h3 className="text-lg font-serif font-bold tracking-[-0.02em] text-obsidian-900 mb-4">
                Write a Review
            </h3>
            <p className="text-sm text-obsidian-500 mb-6">
                Share your experience with {productName}
            </p>

            {message && (
                <div
                    className={`mb-4 px-4 py-3 rounded-sm text-sm flex items-start gap-2 ${
                        message.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                    role="alert"
                    aria-live="polite"
                >
                    {message.type === "success" ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {message?.type === "success" ? null : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Star Rating Selector */}
                    <fieldset>
                        <legend className="text-sm font-medium text-obsidian-900 mb-2">
                            Rating <span className="text-red-500">*</span>
                        </legend>
                        <div
                            className="flex items-center gap-1"
                            role="radiogroup"
                            aria-label="Star rating"
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-gold-500"
                                    role="radio"
                                    aria-checked={rating === star}
                                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                                >
                                    <Star
                                        className={`w-7 h-7 transition-colors ${
                                            star <= displayRating
                                                ? "fill-gold-500 text-gold-500"
                                                : "fill-obsidian-200 text-obsidian-200"
                                        }`}
                                    />
                                </button>
                            ))}
                            {displayRating > 0 && (
                                <span className="ml-2 text-sm text-obsidian-500">
                                    {displayRating} / 5
                                </span>
                            )}
                        </div>
                    </fieldset>

                    {/* Title */}
                    <div>
                        <label
                            htmlFor="review-title"
                            className="block text-sm font-medium text-obsidian-900 mb-1.5"
                        >
                            Title{" "}
                            <span className="text-obsidian-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="review-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            placeholder="Summarize your review"
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-300 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                        />
                    </div>

                    {/* Comment */}
                    <div>
                        <label
                            htmlFor="review-comment"
                            className="block text-sm font-medium text-obsidian-900 mb-1.5"
                        >
                            Review{" "}
                            <span className="text-obsidian-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="review-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={2000}
                            rows={4}
                            placeholder="What did you like or dislike about this product?"
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-300 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors resize-vertical"
                        />
                        {comment.length > 0 && (
                            <p className="text-xs text-obsidian-400 mt-1 text-right">
                                {comment.length}/2000
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || rating === 0}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-obsidian-900 text-white text-sm font-medium rounded-sm hover:bg-obsidian-800 focus-visible:outline-2 focus-visible:outline-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Review"
                        )}
                    </button>
                </form>
            )}
        </div>
    )
}
