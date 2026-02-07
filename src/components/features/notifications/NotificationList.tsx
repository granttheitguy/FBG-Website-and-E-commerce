"use client"

import {
    Package,
    CreditCard,
    Headphones,
    Megaphone,
    Settings,
    Scissors,
    Factory,
    Trash2,
    Circle,
} from "lucide-react"
import type { Notification, NotificationType } from "@/types/notification"

/* ------------------------------------------------------------------ */
/*  Type icon + color mapping                                         */
/* ------------------------------------------------------------------ */

interface TypeStyle {
    icon: React.ComponentType<{ className?: string }>
    bg: string
    fg: string
}

const TYPE_STYLES: Record<NotificationType, TypeStyle> = {
    ORDER_UPDATE: {
        icon: Package,
        bg: "bg-blue-50",
        fg: "text-blue-600",
    },
    PAYMENT: {
        icon: CreditCard,
        bg: "bg-green-50",
        fg: "text-green-600",
    },
    SUPPORT: {
        icon: Headphones,
        bg: "bg-amber-50",
        fg: "text-amber-600",
    },
    PROMOTION: {
        icon: Megaphone,
        bg: "bg-gold-50",
        fg: "text-gold-600",
    },
    SYSTEM: {
        icon: Settings,
        bg: "bg-obsidian-50",
        fg: "text-obsidian-600",
    },
    BESPOKE: {
        icon: Scissors,
        bg: "bg-purple-50",
        fg: "text-purple-600",
    },
    PRODUCTION: {
        icon: Factory,
        bg: "bg-rose-50",
        fg: "text-rose-600",
    },
}

/* ------------------------------------------------------------------ */
/*  Time-ago formatter                                                */
/* ------------------------------------------------------------------ */

function timeAgo(dateString: string): string {
    const now = Date.now()
    const then = new Date(dateString).getTime()
    const seconds = Math.floor((now - then) / 1000)

    if (seconds < 60) return "Just now"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`

    return new Date(dateString).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
    })
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface NotificationListProps {
    notifications: Notification[]
    /** Called when a single notification should be marked as read */
    onMarkRead: (id: string) => void
    /** Called when user clicks "Mark all as read" */
    onMarkAllRead: () => void
    /** Called when user deletes a notification */
    onDelete?: (id: string) => void
    /** Called when user clicks a notification with a linkUrl */
    onNavigate?: (url: string) => void
    /** Whether to show the "Mark all as read" header action */
    showMarkAllRead?: boolean
    /** Compact mode for dropdown usage (less padding, no delete button) */
    compact?: boolean
    /** Loading state */
    isLoading?: boolean
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                   */
/* ------------------------------------------------------------------ */

function NotificationSkeleton({ compact }: { compact: boolean }) {
    const padding = compact ? "px-4 py-3" : "px-5 py-4"
    return (
        <div className={`${padding} flex gap-3 animate-pulse`}>
            <div className="w-9 h-9 rounded-sm bg-obsidian-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-obsidian-100 rounded-sm w-2/3" />
                <div className="h-3 bg-obsidian-50 rounded-sm w-full" />
                <div className="h-2.5 bg-obsidian-50 rounded-sm w-16" />
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function NotificationList({
    notifications,
    onMarkRead,
    onMarkAllRead,
    onDelete,
    onNavigate,
    showMarkAllRead = true,
    compact = false,
    isLoading = false,
}: NotificationListProps) {
    const hasUnread = notifications.some((n) => !n.isRead)

    if (isLoading) {
        return (
            <div className="divide-y divide-obsidian-100" role="status" aria-label="Loading notifications">
                {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
                    <NotificationSkeleton key={i} compact={compact} />
                ))}
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-16 px-6"}`}>
                <div className="w-12 h-12 rounded-full bg-obsidian-50 flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-obsidian-300" />
                </div>
                <p className="text-sm font-medium text-obsidian-700 mb-1">
                    No notifications yet
                </p>
                <p className="text-xs text-obsidian-400">
                    We will notify you about orders, payments, and more.
                </p>
            </div>
        )
    }

    return (
        <div>
            {/* Header with Mark all as read */}
            {showMarkAllRead && hasUnread && (
                <div className={`flex items-center justify-end border-b border-obsidian-100 ${compact ? "px-4 py-2" : "px-5 py-3"}`}>
                    <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="text-xs font-medium text-gold-600 hover:text-gold-500 transition-colors min-h-[32px] flex items-center"
                    >
                        Mark all as read
                    </button>
                </div>
            )}

            {/* Notification items */}
            <ul className="divide-y divide-obsidian-100" role="list" aria-label="Notifications">
                {notifications.map((notification) => {
                    const style = TYPE_STYLES[notification.type]
                    const Icon = style.icon
                    const isClickable = !!notification.linkUrl

                    return (
                        <li key={notification.id}>
                            <div
                                role={isClickable ? "button" : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                                onClick={() => {
                                    if (!notification.isRead) {
                                        onMarkRead(notification.id)
                                    }
                                    if (notification.linkUrl && onNavigate) {
                                        onNavigate(notification.linkUrl)
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if ((e.key === "Enter" || e.key === " ") && isClickable) {
                                        e.preventDefault()
                                        if (!notification.isRead) {
                                            onMarkRead(notification.id)
                                        }
                                        if (notification.linkUrl && onNavigate) {
                                            onNavigate(notification.linkUrl)
                                        }
                                    }
                                }}
                                className={`
                                    flex gap-3 group transition-colors
                                    ${compact ? "px-4 py-3" : "px-5 py-4"}
                                    ${!notification.isRead ? "bg-gold-50/40" : "bg-white"}
                                    ${isClickable ? "cursor-pointer hover:bg-obsidian-50" : ""}
                                `}
                            >
                                {/* Type icon */}
                                <div
                                    className={`
                                        w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0
                                        ${style.bg}
                                    `}
                                >
                                    <Icon className={`w-4 h-4 ${style.fg}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={`text-sm leading-snug ${compact ? "line-clamp-1" : ""} ${
                                                !notification.isRead
                                                    ? "font-medium text-obsidian-900"
                                                    : "text-obsidian-700"
                                            }`}
                                        >
                                            {notification.title}
                                        </p>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {/* Unread indicator */}
                                            {!notification.isRead && (
                                                <Circle
                                                    className="w-2 h-2 text-gold-500 fill-gold-500"
                                                    aria-label="Unread"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <p
                                        className={`text-xs text-obsidian-500 mt-0.5 leading-relaxed ${
                                            compact ? "line-clamp-1" : "line-clamp-2"
                                        }`}
                                    >
                                        {notification.message}
                                    </p>

                                    <p className="text-[11px] text-obsidian-400 mt-1">
                                        {timeAgo(notification.createdAt)}
                                    </p>
                                </div>

                                {/* Delete button -- full mode only */}
                                {!compact && onDelete && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(notification.id)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-obsidian-400 hover:text-red-600 rounded-sm self-center"
                                        aria-label={`Delete notification: ${notification.title}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
