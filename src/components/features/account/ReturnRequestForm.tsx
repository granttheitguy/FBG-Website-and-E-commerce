"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ReturnRequestFormProps {
    orderId: string
    orderNumber: string
}

export function ReturnRequestForm({
    orderId,
    orderNumber,
}: ReturnRequestFormProps) {
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (reason.trim().length < 10) {
            setError("Please describe the reason (at least 10 characters).")
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/returns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, reason: reason.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Something went wrong. Please try again.")
                return
            }

            setSuccess(true)
        } catch {
            setError("Network error. Please check your connection and try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-sm p-4" role="status">
                <p className="text-green-800 text-sm font-medium">
                    Return request submitted successfully.
                </p>
                <p className="text-green-700 text-sm mt-1">
                    Your return request for order #{orderNumber} is now pending review.
                    We will notify you once it has been processed.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label
                    htmlFor="return-reason"
                    className="text-sm font-medium text-obsidian-900"
                >
                    Reason for return
                </label>
                <textarea
                    id="return-reason"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                    placeholder="Please describe why you would like to return this order..."
                    required
                    minLength={10}
                    maxLength={2000}
                    className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y min-h-[100px]"
                    aria-describedby="return-reason-help"
                />
                <p id="return-reason-help" className="text-xs text-obsidian-500">
                    Minimum 10 characters. Be as specific as possible to help us process your request quickly.
                </p>
            </div>

            <Button
                type="submit"
                loading={loading}
                disabled={loading || reason.trim().length < 10}
                className="w-full"
            >
                Submit Return Request
            </Button>
        </form>
    )
}
