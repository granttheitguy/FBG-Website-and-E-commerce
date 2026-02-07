"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { processReturn } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProcessReturnFormProps {
    returnId: string
    currentStatus: string
    orderTotal: number
    currentRefundAmount: number | null
    currentAdminNotes: string | null
}

export function ProcessReturnForm({
    returnId,
    currentStatus,
    orderTotal,
    currentRefundAmount,
    currentAdminNotes,
}: ProcessReturnFormProps) {
    const router = useRouter()
    const [status, setStatus] = useState(currentStatus)
    const [refundAmount, setRefundAmount] = useState(
        currentRefundAmount?.toString() ?? ""
    )
    const [adminNotes, setAdminNotes] = useState(currentAdminNotes ?? "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        const parsedRefund = refundAmount ? parseFloat(refundAmount) : null

        if (parsedRefund !== null && (isNaN(parsedRefund) || parsedRefund < 0)) {
            setError("Refund amount must be a valid positive number.")
            setLoading(false)
            return
        }

        if (parsedRefund !== null && parsedRefund > orderTotal) {
            setError(
                `Refund amount cannot exceed the order total of ${orderTotal.toLocaleString()}.`
            )
            setLoading(false)
            return
        }

        const result = await processReturn(
            returnId,
            status,
            parsedRefund,
            adminNotes || null
        )

        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess("Return request updated successfully.")
            router.refresh()
        }
    }

    const isTerminal = currentStatus === "COMPLETED" || currentStatus === "REJECTED"

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-sm text-sm"
                    role="status"
                >
                    {success}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isTerminal || loading}
                    className="flex h-12 w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="COMPLETED">Completed</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount (NGN)</Label>
                <Input
                    id="refundAmount"
                    type="number"
                    min="0"
                    max={orderTotal}
                    step="0.01"
                    placeholder={`Max: ${orderTotal.toLocaleString()}`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    disabled={isTerminal || loading}
                />
                <p className="text-xs text-obsidian-500">
                    Order total: NGN {orderTotal.toLocaleString()}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <textarea
                    id="adminNotes"
                    rows={4}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    disabled={isTerminal || loading}
                    placeholder="Internal notes about this return..."
                    className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y min-h-[100px]"
                />
            </div>

            {isTerminal ? (
                <p className="text-sm text-obsidian-500 italic">
                    This return request has been {currentStatus.toLowerCase()}{" "}
                    and cannot be modified further.
                </p>
            ) : (
                <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || status === currentStatus}
                    className="w-full"
                >
                    Update Return Request
                </Button>
            )}
        </form>
    )
}
