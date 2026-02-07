// ============================================
// ERP Types - Serialized for client components
// All dates are ISO strings, not Date objects
// ============================================

export type BespokeOrderStatus =
    | "INQUIRY"
    | "CONSULTATION"
    | "MEASUREMENT"
    | "DESIGN_APPROVAL"
    | "FABRIC_SOURCING"
    | "IN_PRODUCTION"
    | "FITTING"
    | "ALTERATIONS"
    | "QUALITY_CHECK"
    | "READY"
    | "DELIVERED"
    | "CANCELLED"

export type ProductionTaskStatus =
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "ON_HOLD"
    | "CANCELLED"

export type ProductionStage =
    | "CUTTING"
    | "SEWING"
    | "EMBROIDERY"
    | "BEADING"
    | "FINISHING"
    | "QC"
    | "PRESSING"
    | "OTHER"

/** All 12 bespoke status values in pipeline order */
export const BESPOKE_STATUS_ORDER: BespokeOrderStatus[] = [
    "INQUIRY",
    "CONSULTATION",
    "MEASUREMENT",
    "DESIGN_APPROVAL",
    "FABRIC_SOURCING",
    "IN_PRODUCTION",
    "FITTING",
    "ALTERATIONS",
    "QUALITY_CHECK",
    "READY",
    "DELIVERED",
    "CANCELLED",
]

/** Human-readable labels for bespoke statuses */
export const BESPOKE_STATUS_LABELS: Record<BespokeOrderStatus, string> = {
    INQUIRY: "Inquiry",
    CONSULTATION: "Consultation",
    MEASUREMENT: "Measurement",
    DESIGN_APPROVAL: "Design Approval",
    FABRIC_SOURCING: "Fabric Sourcing",
    IN_PRODUCTION: "In Production",
    FITTING: "Fitting",
    ALTERATIONS: "Alterations",
    QUALITY_CHECK: "Quality Check",
    READY: "Ready",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
}

/** Color mappings for bespoke status badges */
export const BESPOKE_STATUS_COLORS: Record<BespokeOrderStatus, { bg: string; text: string; border: string }> = {
    INQUIRY: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    CONSULTATION: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    MEASUREMENT: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    DESIGN_APPROVAL: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
    FABRIC_SOURCING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    IN_PRODUCTION: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    FITTING: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    ALTERATIONS: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    QUALITY_CHECK: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    READY: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    DELIVERED: { bg: "bg-obsidian-50", text: "text-obsidian-700", border: "border-obsidian-200" },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
}

/** Human-readable labels for production task statuses */
export const TASK_STATUS_LABELS: Record<ProductionTaskStatus, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    ON_HOLD: "On Hold",
    CANCELLED: "Cancelled",
}

/** Color mappings for production task status badges */
export const TASK_STATUS_COLORS: Record<ProductionTaskStatus, { bg: string; text: string; border: string }> = {
    NOT_STARTED: { bg: "bg-obsidian-50", text: "text-obsidian-600", border: "border-obsidian-200" },
    IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    COMPLETED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    ON_HOLD: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
}

/** Human-readable labels for production stages */
export const STAGE_LABELS: Record<ProductionStage, string> = {
    CUTTING: "Cutting",
    SEWING: "Sewing",
    EMBROIDERY: "Embroidery",
    BEADING: "Beading",
    FINISHING: "Finishing",
    QC: "Quality Control",
    PRESSING: "Pressing",
    OTHER: "Other",
}

// ============================================
// Serialized Data Types for Client Components
// ============================================

export interface BespokeStatusLogDetail {
    id: string
    oldStatus: string
    newStatus: string
    note: string | null
    createdAt: string
    changedBy: {
        id: string
        name: string
    }
}

export interface ProductionTaskDetail {
    id: string
    bespokeOrderId: string
    title: string
    description: string | null
    stage: string
    status: ProductionTaskStatus
    priority: number
    sortOrder: number
    estimatedHours: number | null
    actualHours: number | null
    dueDate: string | null
    completedAt: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
    assignedTo: {
        id: string
        name: string
    } | null
    bespokeOrder?: {
        id: string
        orderNumber: string
        customerName: string
        status: BespokeOrderStatus
    }
}

export interface BespokeOrderListItem {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string | null
    customerPhone: string
    status: BespokeOrderStatus
    estimatedPrice: number | null
    finalPrice: number | null
    depositAmount: number | null
    depositPaid: boolean
    estimatedCompletionDate: string | null
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
    } | null
    _count: {
        tasks: number
    }
}

export interface BespokeOrderDetail {
    id: string
    orderNumber: string
    userId: string | null
    customerName: string
    customerEmail: string | null
    customerPhone: string
    status: BespokeOrderStatus
    designDescription: string | null
    designImages: string[] | null
    referenceImages: string[] | null
    measurementId: string | null
    estimatedPrice: number | null
    finalPrice: number | null
    depositAmount: number | null
    depositPaid: boolean
    fabricDetails: Record<string, unknown> | null
    estimatedCompletionDate: string | null
    actualCompletionDate: string | null
    internalNotes: string | null
    customerNotes: string | null
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
    } | null
    measurement: {
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
    } | null
    tasks: ProductionTaskDetail[]
    statusLogs: BespokeStatusLogDetail[]
}

export interface FabricDetail {
    id: string
    name: string
    type: string
    color: string | null
    pattern: string | null
    quantityYards: number
    minStockLevel: number
    costPerYard: number | null
    supplierId: string | null
    isAvailable: boolean
    location: string | null
    imageUrl: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
    supplier: {
        id: string
        name: string
    } | null
}

export interface SupplierDetail {
    id: string
    name: string
    contactName: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
    address: string | null
    city: string | null
    state: string | null
    notes: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
    _count: {
        fabrics: number
    }
}

export interface SupplierWithFabrics extends SupplierDetail {
    fabrics: FabricDetail[]
}

export interface StaffMember {
    id: string
    name: string
    email: string
}
