"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface OrderStatusSelectProps {
    orderId: string
    currentStatus: string
}

export default function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
    const router = useRouter()
    const [status, setStatus] = useState(currentStatus)
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!response.ok) throw new Error("Failed to update status")

            setStatus(newStatus)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update status")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative">
            <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isLoading}
                className="appearance-none bg-white border border-obsidian-300 text-obsidian-900 text-sm rounded-sm focus:ring-obsidian-500 focus:border-obsidian-500 block w-full p-2.5 pr-8 disabled:opacity-50"
            >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
            </select>
            {isLoading && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-obsidian-300 border-t-obsidian-900 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    )
}
