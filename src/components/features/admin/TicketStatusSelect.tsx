"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface TicketStatusSelectProps {
    ticketId: string
    currentStatus: string
}

export default function TicketStatusSelect({ ticketId, currentStatus }: TicketStatusSelectProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleStatusChange(newStatus: string) {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/tickets/${ticketId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!response.ok) throw new Error("Failed to update status")

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
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isLoading}
                className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${currentStatus === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-100 focus:ring-blue-500' :
                        currentStatus === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 focus:ring-yellow-500' :
                            currentStatus === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-100 focus:ring-green-500' :
                                'bg-obsidian-100 text-obsidian-600 border-obsidian-200 focus:ring-obsidian-500'
                    }`}
            >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
            </select>
            {isLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Loader2 className="w-3 h-3 animate-spin text-obsidian-400" />
                </div>
            )}
        </div>
    )
}
