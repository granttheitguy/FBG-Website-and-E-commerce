import { z } from "zod"

// User & Auth Schemas
export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
})

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
})

export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
})

export const updateUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
})

export const smtpSettingsSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().int().positive("Port must be a positive integer"),
    encryption: z.enum(["none", "ssl", "tls"]),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    fromName: z.string().min(1, "From Name is required"),
    fromEmail: z.string().email("Invalid email address"),
    replyToEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
})

// Order Schemas
export const orderItemSchema = z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    name: z.string(),
    size: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
})

export const orderSchema = z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    address: z.string().min(1, "Address is required").max(200),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    zip: z.string().min(1, "ZIP code is required").max(20),
    phone: z.string().min(1, "Phone is required").max(20),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    total: z.number().positive(),
})

// Product Schemas
export const productVariantSchema = z.object({
    size: z.string().min(1).max(50),
    stockQty: z.number().int().min(0),
    priceOverride: z.number().positive().optional(),
})

export const productSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    slug: z.string().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    descriptionShort: z.string().max(500).optional(),
    descriptionLong: z.string().optional(),
    basePrice: z.number().positive("Price must be positive"),
    status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("DRAFT"),
    isNew: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    images: z.array(z.string().url()).optional(),
    variants: z.array(productVariantSchema).optional(),
})

// Profile Schema
export const profileUpdateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().max(20).optional(),
    address: z.object({
        address: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        zip: z.string().max(20).optional(),
    }).optional(),
})

// Support Ticket Schemas
export const ticketSchema = z.object({
    subject: z.string().min(1, "Subject is required").max(200),
    message: z.string().min(1, "Message is required").max(5000),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    orderId: z.string().optional(),
})

export const ticketMessageSchema = z.object({
    message: z.string().min(1, "Message is required").max(5000),
})

// Order Status Update Schema
export const orderStatusSchema = z.object({
    status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
})

// ============================================
// CRM / ERP Schemas
// ============================================

// Coupon
export const couponSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters").max(50).transform(v => v.toUpperCase()),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.number().positive("Value must be positive"),
    minOrderAmount: z.number().positive().optional(),
    maxUses: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
})

export const couponValidateSchema = z.object({
    code: z.string().min(1, "Coupon code is required"),
    subtotal: z.number().positive(),
})

// Shipping
export const shippingZoneSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    states: z.string().min(1, "At least one state is required"), // JSON array string
    isActive: z.boolean().default(true),
})

export const shippingRateSchema = z.object({
    shippingZoneId: z.string().min(1, "Shipping zone is required"),
    name: z.string().min(1, "Name is required").max(100),
    price: z.number().min(0, "Price must be 0 or greater"),
    estimatedDays: z.string().min(1, "Estimated days is required"),
    isActive: z.boolean().default(true),
})

// Review
export const reviewSchema = z.object({
    productId: z.string().min(1, "Product is required"),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(200).optional(),
    comment: z.string().max(2000).optional(),
})

// Contact Message
export const contactMessageSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email address"),
    message: z.string().min(10, "Message must be at least 10 characters").max(5000),
})

// Consultation Booking
export const consultationBookingSchema = z.object({
    name: z.string().min(2, "Name is required").max(100),
    phone: z.string().min(7, "Phone is required").max(20),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    type: z.enum(["measurement", "wedding", "fabric", "pickup"]),
    message: z.string().max(2000).optional(),
    preferredDate: z.string().optional(),
})

// Newsletter
export const newsletterSchema = z.object({
    email: z.string().email("Invalid email address"),
    source: z.string().optional(),
})

// Return Request
export const returnRequestSchema = z.object({
    orderId: z.string().min(1, "Order is required"),
    reason: z.string().min(10, "Please describe the reason (at least 10 characters)").max(2000),
})

// Address
export const addressSchema = z.object({
    label: z.string().min(1, "Label is required").max(50),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    address1: z.string().min(1, "Address is required").max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    postalCode: z.string().max(20).optional(),
    phone: z.string().min(7, "Phone is required").max(20),
    isDefault: z.boolean().default(false),
})

// Page Content (CMS)
export const pageContentSchema = z.object({
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    title: z.string().min(1, "Title is required").max(200),
    content: z.string().min(1, "Content is required"),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
    isPublished: z.boolean().default(true),
})

// Store Settings
export const storeSettingsSchema = z.object({
    storeName: z.string().min(1, "Store name is required").max(200),
    storeEmail: z.string().email().optional().or(z.literal("")),
    storePhone: z.string().max(20).optional(),
    storeAddress: z.string().optional(),
    currency: z.string().default("NGN"),
    paystackPublicKey: z.string().optional(),
    paystackSecretKey: z.string().optional(),
    whatsappNumber: z.string().max(20).optional(),
    socialLinks: z.string().optional(), // JSON
    freeShippingThreshold: z.number().positive().optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    faviconUrl: z.string().url().optional().or(z.literal("")),
})

// Shop Filters (URL search params)
export const shopFilterSchema = z.object({
    category: z.string().optional(),
    collection: z.string().optional(),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    sort: z.enum(["newest", "price-asc", "price-desc", "best-selling"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    q: z.string().optional(),
})

// Search
export const searchSchema = z.object({
    q: z.string().min(1, "Search query is required").max(200),
    limit: z.coerce.number().int().min(1).max(50).default(10),
})

// Category
export const categorySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    parentId: z.string().optional(),
    description: z.string().max(500).optional(),
})

// Collection
export const collectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    description: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
})

// Customer Note
export const customerNoteSchema = z.object({
    note: z.string().min(1, "Note is required").max(2000),
})

// Stock Adjustment
export const stockAdjustmentSchema = z.object({
    productVariantId: z.string().min(1, "Variant is required"),
    type: z.enum(["ADDITION", "DEDUCTION", "ADJUSTMENT"]),
    quantity: z.number().int().positive("Quantity must be positive"),
    reason: z.string().min(1, "Reason is required").max(500),
})

// ============================================
// CRM Schemas
// ============================================

export const customerMeasurementSchema = z.object({
    label: z.string().min(1, "Label is required").max(100).default("Default"),
    chest: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    shoulder: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    sleeveLength: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    neck: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    backLength: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    waist: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    hip: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    inseam: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    outseam: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    thigh: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    height: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    weight: z.coerce.number().positive().optional().or(z.literal(0)).or(z.literal(undefined)),
    notes: z.string().max(2000).optional(),
    measuredBy: z.string().max(100).optional(),
    measuredAt: z.string().optional(),
})

export const customerInteractionSchema = z.object({
    userId: z.string().min(1, "Customer is required"),
    type: z.enum(["CALL", "EMAIL", "WHATSAPP", "VISIT", "NOTE", "PURCHASE", "RETURN"]),
    subject: z.string().max(200).optional(),
    description: z.string().min(1, "Description is required").max(5000),
})

export const customerSegmentSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").default("#78716C"),
    isAutomatic: z.boolean().default(false),
})

export const customerTagSchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").default("#C8973E"),
})

// ============================================
// ERP Schemas
// ============================================

export const bespokeOrderSchema = z.object({
    customerName: z.string().min(2, "Name is required").max(100),
    customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    customerPhone: z.string().min(7, "Phone is required").max(20),
    userId: z.string().optional(),
    measurementId: z.string().optional(),
    designDescription: z.string().max(5000).optional(),
    estimatedPrice: z.coerce.number().positive().optional(),
    finalPrice: z.coerce.number().positive().optional(),
    depositAmount: z.coerce.number().positive().optional(),
    fabricDetails: z.string().optional(),
    estimatedCompletionDate: z.string().optional(),
    internalNotes: z.string().max(5000).optional(),
    customerNotes: z.string().max(5000).optional(),
})

export const bespokeStatusUpdateSchema = z.object({
    status: z.enum([
        "INQUIRY", "CONSULTATION", "MEASUREMENT", "DESIGN_APPROVAL",
        "FABRIC_SOURCING", "IN_PRODUCTION", "FITTING", "ALTERATIONS",
        "QUALITY_CHECK", "READY", "DELIVERED", "CANCELLED",
    ]),
    note: z.string().max(2000).optional(),
})

export const productionTaskSchema = z.object({
    bespokeOrderId: z.string().min(1, "Bespoke order is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    stage: z.enum(["CUTTING", "SEWING", "EMBROIDERY", "BEADING", "FINISHING", "QC", "PRESSING", "OTHER"]),
    assignedToId: z.string().optional(),
    priority: z.coerce.number().int().min(0).max(2).default(0),
    estimatedHours: z.coerce.number().positive().optional(),
    dueDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
})

export const productionTaskStatusSchema = z.object({
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]),
    actualHours: z.coerce.number().positive().optional(),
    notes: z.string().max(2000).optional(),
})

export const fabricInventorySchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    type: z.string().min(1, "Type is required").max(100),
    color: z.string().max(100).optional(),
    pattern: z.string().max(100).optional(),
    quantityYards: z.coerce.number().min(0, "Quantity must be 0 or greater"),
    minStockLevel: z.coerce.number().min(0).default(0),
    costPerYard: z.coerce.number().positive().optional(),
    supplierId: z.string().optional(),
    location: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
})

export const supplierSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    contactName: z.string().max(100).optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().max(20).optional(),
    whatsapp: z.string().max(20).optional(),
    address: z.string().max(300).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
})
