export interface CustomerTag {
    id: string
    name: string
    color: string
}

export interface CustomerTagWithCount extends CustomerTag {
    customerCount: number
}

export interface CustomerSegment {
    id: string
    name: string
    color: string
    description?: string | null
}

export interface CustomerSegmentWithCount extends CustomerSegment {
    isAutomatic: boolean
    memberCount: number
    createdAt: string
    updatedAt: string
}

export interface CustomerListItem {
    id: string
    name: string
    email: string
    phone: string | null
    orderCount: number
    totalSpent: number
    lastOrderDate: string | null
    segments: CustomerSegment[]
    tags: CustomerTag[]
    createdAt: string
}

export interface CustomerListResponse {
    customers: CustomerListItem[]
    total: number
    page: number
    totalPages: number
}

export interface CustomerMeasurement {
    id: string
    label: string
    chest: number | null
    shoulder: number | null
    sleeveLength: number | null
    neck: number | null
    backLength: number | null
    waist: number | null
    hip: number | null
    inseam: number | null
    outseam: number | null
    thigh: number | null
    height: number | null
    weight: number | null
    notes: string | null
    measuredBy: string | null
    measuredAt: string | null
    createdAt: string
    updatedAt: string
}

export type InteractionType = "CALL" | "EMAIL" | "WHATSAPP" | "VISIT" | "NOTE" | "PURCHASE" | "RETURN"

export interface CustomerInteraction {
    id: string
    type: InteractionType
    subject: string | null
    description: string
    metadata: Record<string, unknown> | null
    createdAt: string
    staff: {
        id: string
        name: string
    } | null
}

export interface CustomerOrder {
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
    total: number
    currency: string
    placedAt: string
    items: {
        nameSnapshot: string
        quantity: number
        unitPrice: number
        totalPrice: number
    }[]
}

export interface CustomerTicket {
    id: string
    subject: string
    status: string
    priority: string
    createdAt: string
    updatedAt: string
}

export interface CustomerNote {
    id: string
    note: string
    createdAt: string
    createdBy: {
        name: string
    }
}

export interface Customer360 {
    id: string
    name: string
    email: string
    role: string
    status: string
    createdAt: string
    lastLoginAt: string | null
    profile: {
        phone: string | null
        defaultShippingAddress: Record<string, string> | null
        notes: string | null
    } | null
    orders: CustomerOrder[]
    measurements: CustomerMeasurement[]
    customerInteractions: CustomerInteraction[]
    tickets: CustomerTicket[]
    customerNotes: CustomerNote[]
    segments: CustomerSegment[]
    tags: CustomerTag[]
    _count: {
        orders: number
        tickets: number
    }
    totalSpent: number
    averageOrderValue: number
}

export interface MeasurementFormData {
    label: string
    chest: number | string
    shoulder: number | string
    sleeveLength: number | string
    neck: number | string
    backLength: number | string
    waist: number | string
    hip: number | string
    inseam: number | string
    outseam: number | string
    thigh: number | string
    height: number | string
    weight: number | string
    notes: string
    measuredBy: string
    measuredAt: string
}

export interface InteractionFormData {
    type: InteractionType
    subject: string
    description: string
}
