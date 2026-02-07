"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2 } from "lucide-react"

export default function ReplyForm({ ticketId }: { ticketId: string }) {
    const router = useRouter()
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!message.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/tickets/${ticketId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            })

            if (!response.ok) throw new Error("Failed to send message")

            setMessage("")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to send message. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-4">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply..."
                required
                className="flex-1 rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 text-sm resize-none py-3"
                rows={1}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                    }
                }}
            />
            <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-obsidian-900 text-white px-4 rounded-sm hover:bg-obsidian-800 transition-colors flex items-center justify-center disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
        </form>
    )
}
