"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/hooks/use-notifications"
import NotificationList from "./NotificationList"

/**
 * NotificationBell -- displayed in the site header.
 * Shows a bell icon with an unread count badge.
 * Clicking it opens a dropdown with the 5 most recent notifications.
 * Polls the unread count every 30 seconds via the useNotifications hook.
 * Only renders when the user is authenticated (checks session on mount).
 */
export default function NotificationBell() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const {
        unreadCount,
        recentNotifications,
        isLoadingRecent,
        markAsRead,
        markAllAsRead,
        refresh,
    } = useNotifications()

    // Check authentication status on mount
    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/session")
                if (!res.ok) return
                const data = await res.json()
                setIsAuthenticated(!!data?.user)
            } catch {
                // Not authenticated
            }
        }
        checkSession()
    }, [])

    // Fetch recent notifications when dropdown opens
    const handleToggle = useCallback(() => {
        setIsOpen((prev) => {
            const next = !prev
            if (next) {
                refresh()
            }
            return next
        })
    }, [refresh])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    // Close dropdown on Escape
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false)
                buttonRef.current?.focus()
            }
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen])

    // Navigate to a notification's link
    const handleNavigate = useCallback(
        (url: string) => {
            setIsOpen(false)
            router.push(url)
        },
        [router]
    )

    // Mark single as read, then navigate
    const handleMarkRead = useCallback(
        async (id: string) => {
            await markAsRead(id)
        },
        [markAsRead]
    )

    // Mark all as read
    const handleMarkAllAsRead = useCallback(async () => {
        await markAllAsRead()
    }, [markAllAsRead])

    // Format badge number (99+)
    const badgeText = unreadCount > 99 ? "99+" : String(unreadCount)

    // Don't render the bell for unauthenticated users
    if (!isAuthenticated) return null

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-obsidian-600 hover:text-obsidian-900 transition-colors relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell className="w-5 h-5" />

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span
                        className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center leading-none"
                        aria-hidden="true"
                    >
                        {badgeText}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    role="dialog"
                    aria-label="Recent notifications"
                    className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-32px)] bg-white border border-obsidian-200 rounded-sm shadow-lg z-50 overflow-hidden"
                >
                    {/* Dropdown header */}
                    <div className="px-4 py-3 border-b border-obsidian-100 bg-surface-secondary">
                        <h3 className="text-sm font-semibold text-obsidian-900">
                            Notifications
                        </h3>
                    </div>

                    {/* Notification list -- compact mode */}
                    <div className="max-h-[400px] overflow-y-auto">
                        <NotificationList
                            notifications={recentNotifications}
                            onMarkRead={handleMarkRead}
                            onMarkAllRead={handleMarkAllAsRead}
                            onNavigate={handleNavigate}
                            showMarkAllRead={true}
                            compact={true}
                            isLoading={isLoadingRecent}
                        />
                    </div>

                    {/* Footer -- View all link */}
                    {recentNotifications.length > 0 && (
                        <div className="border-t border-obsidian-100 px-4 py-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push("/account/notifications")
                                }}
                                className="w-full text-center text-xs font-medium text-gold-600 hover:text-gold-500 transition-colors py-1 min-h-[32px] flex items-center justify-center"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
