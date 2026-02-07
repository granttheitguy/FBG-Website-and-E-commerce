"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2, Send } from "lucide-react"

export default function NewTicketPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            subject: formData.get("subject"),
            message: formData.get("message"),
            priority: formData.get("priority"),
            orderId: formData.get("orderId") || undefined,
        }

        try {
            const response = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || "Failed to create ticket")
            }

            router.push("/account/tickets")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/account/tickets" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-obsidian-900">New Support Ticket</h1>
                    <p className="text-obsidian-500 mt-1">Describe your issue and we'll get back to you.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-obsidian-200 rounded-sm shadow-sm p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-obsidian-700 mb-1">Subject</label>
                    <input
                        type="text"
                        name="subject"
                        id="subject"
                        required
                        placeholder="Brief summary of the issue"
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-obsidian-700 mb-1">Priority</label>
                        <select
                            name="priority"
                            id="priority"
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        >
                            <option value="LOW">Low</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="orderId" className="block text-sm font-medium text-obsidian-700 mb-1">Related Order (Optional)</label>
                        <input
                            type="text"
                            name="orderId"
                            id="orderId"
                            placeholder="Order #"
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-obsidian-700 mb-1">Message</label>
                    <textarea
                        name="message"
                        id="message"
                        rows={6}
                        required
                        placeholder="Please provide as much detail as possible..."
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit Ticket
                    </button>
                </div>
            </form>
        </div>
    )
}
