"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronLeft, ChevronRight } from "lucide-react"
import NotificationList from "@/components/features/notifications/NotificationList"
import type { Notification, NotificationListResponse } from "@/types/notification"

export default function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch notifications for the current page
    const fetchNotifications = useCallback(async (pageNum: number) => {
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/notifications?page=${pageNum}`)

            if (!res.ok) {
                throw new Error("Failed to load notifications")
            }

            const data: NotificationListResponse = await res.json()
            setNotifications(data.notifications)
            setTotalPages(data.totalPages)
            setTotal(data.total)
            setPage(data.page)
        } catch {
            setError("Could not load your notifications. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications(page)
    }, [page, fetchNotifications])

    // Mark a single notification as read
    const handleMarkRead = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" })
            if (!res.ok) return

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            )
        } catch {
            // Silently fail
        }
    }, [])

    // Mark all as read
    const handleMarkAllAsRead = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications", { method: "PATCH" })
            if (!res.ok) return

            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            )
        } catch {
            // Silently fail
        }
    }, [])

    // Delete a notification
    const handleDelete = useCallback(
        async (id: string) => {
            const removed = notifications.find((n) => n.id === id)
            setNotifications((prev) => prev.filter((n) => n.id !== id))
            setTotal((prev) => Math.max(0, prev - 1))

            try {
                const res = await fetch(`/api/notifications/${id}`, {
                    method: "DELETE",
                })

                if (!res.ok && removed) {
                    // Rollback
                    setNotifications((prev) => [...prev, removed])
                    setTotal((prev) => prev + 1)
                }
            } catch {
                if (removed) {
                    setNotifications((prev) => [...prev, removed])
                    setTotal((prev) => prev + 1)
                }
            }
        },
        [notifications]
    )

    // Navigate from notification link
    const handleNavigate = useCallback(
        (url: string) => {
            router.push(url)
        },
        [router]
    )

    return (
        <div>
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-gold-50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-gold-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                            Notifications
                        </h1>
                        <p className="text-xs text-obsidian-500 mt-0.5">
                            {total} {total === 1 ? "notification" : "notifications"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                        type="button"
                        onClick={() => fetchNotifications(page)}
                        className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors mt-2 underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Notifications list */}
            <div className="bg-white border border-obsidian-200 rounded-sm shadow-sm overflow-hidden">
                <NotificationList
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllAsRead}
                    onDelete={handleDelete}
                    onNavigate={handleNavigate}
                    showMarkAllRead={true}
                    compact={false}
                    isLoading={isLoading}
                />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-xs text-obsidian-500">
                        Page {page} of {totalPages}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-obsidian-700 bg-white border border-obsidian-200 rounded-sm hover:bg-obsidian-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-obsidian-700 bg-white border border-obsidian-200 rounded-sm hover:bg-obsidian-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
