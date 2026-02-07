"use client"

import { useState, useTransition } from "react"
import { toggleSubscription } from "./actions"
import { Mail } from "lucide-react"

interface Subscriber {
    id: string
    email: string
    isSubscribed: boolean
    source: string | null
    subscribedAt: Date
    unsubscribedAt: Date | null
}

interface NewsletterTableProps {
    subscribers: Subscriber[]
}

export function NewsletterTable({ subscribers }: NewsletterTableProps) {
    const [filter, setFilter] = useState<"all" | "active" | "unsubscribed">("all")

    const filtered = subscribers.filter((s) => {
        if (filter === "active") return s.isSubscribed
        if (filter === "unsubscribed") return !s.isSubscribed
        return true
    })

    return (
        <div>
            {/* Filter tabs */}
            <div className="flex gap-1 mb-4">
                {(["all", "active", "unsubscribed"] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 text-sm rounded-sm transition-colors min-h-[44px] ${
                            filter === tab
                                ? "bg-obsidian-900 text-white"
                                : "bg-white text-obsidian-600 hover:bg-obsidian-50 border border-obsidian-200"
                        }`}
                    >
                        {tab === "all" ? "All" : tab === "active" ? "Active" : "Unsubscribed"}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Email</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Source</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Date</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                    <Mail className="w-8 h-8 mx-auto mb-2 text-obsidian-300" />
                                    No subscribers found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((subscriber) => (
                                <SubscriberRow key={subscriber.id} subscriber={subscriber} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-obsidian-400 mt-3">
                Showing {filtered.length} of {subscribers.length} subscribers
            </p>
        </div>
    )
}

function SubscriberRow({ subscriber }: { subscriber: Subscriber }) {
    const [isPending, startTransition] = useTransition()

    function handleToggle() {
        startTransition(async () => {
            const result = await toggleSubscription(subscriber.id)
            if (result.error) {
                alert(result.error)
            }
        })
    }

    return (
        <tr className="hover:bg-obsidian-50 transition-colors">
            <td className="px-6 py-4">
                <span className="font-medium text-obsidian-900">{subscriber.email}</span>
            </td>
            <td className="px-6 py-4 text-obsidian-600">
                {subscriber.source || "—"}
            </td>
            <td className="px-6 py-4">
                {subscriber.isSubscribed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        Subscribed
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        Unsubscribed
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-obsidian-600">
                {new Date(subscriber.subscribedAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-right">
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isPending}
                    className="text-sm font-medium text-obsidian-400 hover:text-obsidian-900 transition-colors disabled:opacity-50 min-w-[48px] min-h-[44px]"
                >
                    {isPending
                        ? "Updating..."
                        : subscriber.isSubscribed
                            ? "Unsubscribe"
                            : "Resubscribe"}
                </button>
            </td>
        </tr>
    )
}
