"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type {
    Notification,
    NotificationListResponse,
    UnreadCountResponse,
} from "@/types/notification"

const POLL_INTERVAL_MS = 30_000
const DROPDOWN_LIMIT = 5

interface UseNotificationsReturn {
    /** Number of unread notifications */
    unreadCount: number
    /** Recent notifications for the dropdown (max 5) */
    recentNotifications: Notification[]
    /** Whether the dropdown data is currently loading */
    isLoadingRecent: boolean
    /** Mark a single notification as read */
    markAsRead: (id: string) => Promise<void>
    /** Mark all notifications as read */
    markAllAsRead: () => Promise<void>
    /** Delete a single notification */
    deleteNotification: (id: string) => Promise<void>
    /** Manually refresh unread count and recent list */
    refresh: () => void
}

/**
 * Client-side hook that manages notification state.
 * Polls unread count every 30 seconds.
 * Fetches recent notifications on demand (when dropdown opens).
 */
export function useNotifications(): UseNotificationsReturn {
    const [unreadCount, setUnreadCount] = useState(0)
    const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
    const [isLoadingRecent, setIsLoadingRecent] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications/unread-count")
            if (!res.ok) return
            const data: UnreadCountResponse = await res.json()
            setUnreadCount(data.count)
        } catch {
            // Silently fail -- user may not be authenticated
        }
    }, [])

    // Fetch recent notifications (first page, take first 5)
    const fetchRecent = useCallback(async () => {
        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsLoadingRecent(true)
        try {
            const res = await fetch("/api/notifications?page=1", {
                signal: controller.signal,
            })
            if (!res.ok) return
            const data: NotificationListResponse = await res.json()
            setRecentNotifications(data.notifications.slice(0, DROPDOWN_LIMIT))
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return
            // Silently fail
        } finally {
            setIsLoadingRecent(false)
        }
    }, [])

    // Combined refresh
    const refresh = useCallback(() => {
        fetchUnreadCount()
        fetchRecent()
    }, [fetchUnreadCount, fetchRecent])

    // Mark a single notification as read
    const markAsRead = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`/api/notifications/${id}`, {
                    method: "PATCH",
                })
                if (!res.ok) return

                setRecentNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            } catch {
                // Silently fail
            }
        },
        []
    )

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
            })
            if (!res.ok) return

            setRecentNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            )
            setUnreadCount(0)
        } catch {
            // Silently fail
        }
    }, [])

    // Delete a single notification
    const deleteNotification = useCallback(
        async (id: string) => {
            try {
                // Optimistically remove from list
                const removedNotification = recentNotifications.find((n) => n.id === id)
                setRecentNotifications((prev) => prev.filter((n) => n.id !== id))

                if (removedNotification && !removedNotification.isRead) {
                    setUnreadCount((prev) => Math.max(0, prev - 1))
                }

                const res = await fetch(`/api/notifications/${id}`, {
                    method: "DELETE",
                })

                if (!res.ok) {
                    // Rollback on failure
                    if (removedNotification) {
                        setRecentNotifications((prev) => [...prev, removedNotification])
                        if (!removedNotification.isRead) {
                            setUnreadCount((prev) => prev + 1)
                        }
                    }
                }
            } catch {
                // Silently fail
            }
        },
        [recentNotifications]
    )

    // Poll unread count every 30 seconds
    useEffect(() => {
        fetchUnreadCount()

        const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [fetchUnreadCount])

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    return {
        unreadCount,
        recentNotifications,
        isLoadingRecent,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    }
}
