export const NOTIFICATION_TYPES = [
    "ORDER_UPDATE",
    "PAYMENT",
    "SUPPORT",
    "PROMOTION",
    "SYSTEM",
    "BESPOKE",
    "PRODUCTION",
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface Notification {
    id: string
    userId: string
    title: string
    message: string
    type: NotificationType
    isRead: boolean
    linkUrl: string | null
    createdAt: string
}

export interface NotificationListResponse {
    notifications: Notification[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export interface UnreadCountResponse {
    count: number
}
