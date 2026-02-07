"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingBag,
    Ruler,
    MessageSquare,
    Ticket,
    Plus,
    Trash2,
    Pencil,
    DollarSign,
    Calendar,
    TrendingUp,
    Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import SegmentBadge from "@/components/features/admin/SegmentBadge"
import CustomerTagPills from "@/components/features/admin/CustomerTagPills"
import CustomerInteractionTimeline from "@/components/features/admin/CustomerInteractionTimeline"
import CustomerMeasurementForm from "@/components/features/admin/CustomerMeasurementForm"
import LogInteractionDialog from "@/components/features/admin/LogInteractionDialog"
import {
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
    createInteraction,
    assignTag,
    removeTag,
    addToSegment,
    removeFromSegment,
} from "../actions"
import type {
    Customer360,
    CustomerSegment,
    CustomerTag,
    CustomerMeasurement,
    MeasurementFormData,
    InteractionFormData,
} from "@/types/crm"

// ---- Types ----

interface Customer360ClientProps {
    customer: Customer360
    allSegments: CustomerSegment[]
    allTags: CustomerTag[]
}

type TabKey = "overview" | "orders" | "measurements" | "interactions" | "tickets"

interface TabDef {
    key: TabKey
    label: string
    icon: typeof LayoutDashboard
}

// ---- Constants ----

const TABS: TabDef[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "measurements", label: "Measurements", icon: Ruler },
    { key: "interactions", label: "Interactions", icon: MessageSquare },
    { key: "tickets", label: "Tickets", icon: Ticket },
]

const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
    SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    REFUNDED: "bg-obsidian-50 text-obsidian-700 border-obsidian-200",
}

const TICKET_STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-amber-50 text-amber-700 border-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    RESOLVED: "bg-green-50 text-green-700 border-green-200",
    CLOSED: "bg-obsidian-50 text-obsidian-700 border-obsidian-200",
}

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "text-obsidian-500",
    NORMAL: "text-blue-600",
    HIGH: "text-amber-600",
    URGENT: "text-red-600",
}

// ---- Component ----

export default function Customer360Client({
    customer,
    allSegments,
    allTags,
}: Customer360ClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabKey>("overview")
    const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
    const [editingMeasurement, setEditingMeasurement] = useState<CustomerMeasurement | null>(null)
    const [interactionDialogOpen, setInteractionDialogOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Segments and tags not yet assigned
    const unassignedSegments = allSegments.filter(
        (s) => !customer.segments.some((cs) => cs.id === s.id)
    )
    const unassignedTags = allTags.filter(
        (t) => !customer.tags.some((ct) => ct.id === t.id)
    )

    // ---- Handlers ----

    const handleAddSegment = useCallback(
        async (segmentId: string) => {
            setActionLoading(true)
            await addToSegment(customer.id, segmentId)
            router.refresh()
            setActionLoading(false)
        },
        [customer.id, router]
    )

    const handleRemoveSegment = useCallback(
        async (segmentId: string) => {
            setActionLoading(true)
            await removeFromSegment(customer.id, segmentId)
            router.refresh()
            setActionLoading(false)
        },
        [customer.id, router]
    )

    const handleAddTag = useCallback(
        async (tagId: string) => {
            setActionLoading(true)
            await assignTag(customer.id, tagId)
            router.refresh()
            setActionLoading(false)
        },
        [customer.id, router]
    )

    const handleRemoveTag = useCallback(
        async (tagId: string) => {
            setActionLoading(true)
            await removeTag(customer.id, tagId)
            router.refresh()
            setActionLoading(false)
        },
        [customer.id, router]
    )

    const handleSaveMeasurement = useCallback(
        async (data: MeasurementFormData) => {
            if (editingMeasurement) {
                const result = await updateMeasurement(
                    customer.id,
                    editingMeasurement.id,
                    data as unknown as Record<string, unknown>
                )
                if (result.error) throw new Error(result.error)
            } else {
                const result = await createMeasurement(
                    customer.id,
                    data as unknown as Record<string, unknown>
                )
                if (result.error) throw new Error(result.error)
            }
            setEditingMeasurement(null)
            router.refresh()
        },
        [customer.id, editingMeasurement, router]
    )

    const handleDeleteMeasurement = useCallback(
        async (measurementId: string) => {
            if (!confirm("Are you sure you want to delete this measurement profile?")) return
            setActionLoading(true)
            await deleteMeasurement(customer.id, measurementId)
            router.refresh()
            setActionLoading(false)
        },
        [customer.id, router]
    )

    const handleLogInteraction = useCallback(
        async (data: InteractionFormData) => {
            const result = await createInteraction(
                customer.id,
                data as unknown as Record<string, unknown>
            )
            if (result.error) throw new Error(result.error)
            router.refresh()
        },
        [customer.id, router]
    )

    // ---- Render Helpers ----

    const renderHeader = () => (
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                    {/* Segments */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                            Segments:
                        </span>
                        {customer.segments.map((seg) => (
                            <SegmentBadge
                                key={seg.id}
                                segment={seg}
                                onRemove={handleRemoveSegment}
                            />
                        ))}
                        {unassignedSegments.length > 0 && (
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) handleAddSegment(e.target.value)
                                }}
                                disabled={actionLoading}
                                className="text-xs border border-dashed border-obsidian-300 rounded-sm px-2 py-1 text-obsidian-500 bg-white hover:border-obsidian-400 transition-colors cursor-pointer"
                                aria-label="Add segment"
                            >
                                <option value="">+ Add segment</option>
                                {unassignedSegments.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-obsidian-500 uppercase tracking-wider">
                            Tags:
                        </span>
                        <CustomerTagPills
                            tags={customer.tags}
                            onRemove={handleRemoveTag}
                        />
                        {unassignedTags.length > 0 && (
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) handleAddTag(e.target.value)
                                }}
                                disabled={actionLoading}
                                className="text-xs border border-dashed border-obsidian-300 rounded-sm px-2 py-1 text-obsidian-500 bg-white hover:border-obsidian-400 transition-colors cursor-pointer"
                                aria-label="Add tag"
                            >
                                <option value="">+ Add tag</option>
                                {unassignedTags.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 text-sm">
                    <div className="text-center px-4">
                        <p className="text-obsidian-400 text-xs">Member Since</p>
                        <p className="font-medium text-obsidian-900 mt-0.5">
                            {formatDate(customer.createdAt)}
                        </p>
                    </div>
                    <div className="text-center px-4 border-l border-obsidian-100">
                        <p className="text-obsidian-400 text-xs">Last Login</p>
                        <p className="font-medium text-obsidian-900 mt-0.5">
                            {customer.lastLoginAt
                                ? formatDate(customer.lastLoginAt)
                                : "Never"}
                        </p>
                    </div>
                    <div className="text-center px-4 border-l border-obsidian-100">
                        <p className="text-obsidian-400 text-xs">Phone</p>
                        <p className="font-medium text-obsidian-900 mt-0.5">
                            {customer.profile?.phone || "--"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderTabs = () => (
        <div className="border-b border-obsidian-200 mb-6 overflow-x-auto" role="tablist" aria-label="Customer sections">
            <div className="flex gap-0 min-w-max">
                {TABS.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.key}`}
                            id={`tab-${tab.key}`}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${
                                isActive
                                    ? "border-gold-500 text-obsidian-900"
                                    : "border-transparent text-obsidian-500 hover:text-obsidian-700 hover:border-obsidian-200"
                            }`}
                        >
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            {tab.label}
                            {tab.key === "orders" && (
                                <span className="text-[11px] bg-obsidian-100 text-obsidian-600 rounded-full px-1.5 py-0.5 font-tabular">
                                    {customer._count.orders}
                                </span>
                            )}
                            {tab.key === "tickets" && customer._count.tickets > 0 && (
                                <span className="text-[11px] bg-obsidian-100 text-obsidian-600 rounded-full px-1.5 py-0.5 font-tabular">
                                    {customer._count.tickets}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )

    // ---- Tab Panels ----

    const renderOverviewTab = () => (
        <div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            className="space-y-6"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<DollarSign className="w-5 h-5 text-gold-500" />}
                    label="Total Spent"
                    value={formatCurrency(customer.totalSpent)}
                />
                <StatCard
                    icon={<ShoppingBag className="w-5 h-5 text-blue-500" />}
                    label="Total Orders"
                    value={String(customer._count.orders)}
                />
                <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                    label="Avg Order Value"
                    value={formatCurrency(customer.averageOrderValue)}
                />
                <StatCard
                    icon={<Calendar className="w-5 h-5 text-purple-500" />}
                    label="Last Order"
                    value={
                        customer.orders[0]
                            ? formatDate(customer.orders[0].placedAt)
                            : "No orders"
                    }
                />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                <div className="px-6 py-4 border-b border-obsidian-100 flex items-center justify-between">
                    <h3 className="font-medium text-obsidian-900">Recent Orders</h3>
                    {customer.orders.length > 0 && (
                        <button
                            onClick={() => setActiveTab("orders")}
                            className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
                        >
                            View all
                        </button>
                    )}
                </div>
                <div className="divide-y divide-obsidian-100">
                    {customer.orders.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                            <ShoppingBag className="w-6 h-6 text-obsidian-300 mx-auto mb-2" />
                            <p className="text-sm text-obsidian-500">No orders yet</p>
                        </div>
                    ) : (
                        customer.orders.slice(0, 5).map((order) => (
                            <div
                                key={order.id}
                                className="px-6 py-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-sm font-medium text-obsidian-900 font-tabular">
                                        #{order.orderNumber}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                            ORDER_STATUS_COLORS[order.status] || "bg-obsidian-50 text-obsidian-700 border-obsidian-200"
                                        }`}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="font-medium font-tabular text-obsidian-900">
                                        {formatCurrency(order.total)}
                                    </span>
                                    <span className="text-obsidian-400 text-xs whitespace-nowrap">
                                        {formatDate(order.placedAt)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Interactions */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                <div className="px-6 py-4 border-b border-obsidian-100 flex items-center justify-between">
                    <h3 className="font-medium text-obsidian-900">Recent Interactions</h3>
                    <button
                        onClick={() => setActiveTab("interactions")}
                        className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
                    >
                        View all
                    </button>
                </div>
                <div className="p-6">
                    <CustomerInteractionTimeline
                        interactions={customer.customerInteractions.slice(0, 5)}
                    />
                </div>
            </div>
        </div>
    )

    const renderOrdersTab = () => (
        <div
            role="tabpanel"
            id="panel-orders"
            aria-labelledby="tab-orders"
        >
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Order</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Payment</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Total</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Date</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Items</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {customer.orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-obsidian-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                customer.orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-obsidian-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <a
                                                href={`/admin/orders/${order.id}`}
                                                className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors font-tabular"
                                            >
                                                #{order.orderNumber}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                                    ORDER_STATUS_COLORS[order.status] || ""
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                                    order.paymentStatus === "PAID"
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-obsidian-50 text-obsidian-600 border-obsidian-200"
                                                }`}
                                            >
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-tabular font-medium text-obsidian-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap">
                                            {formatDate(order.placedAt)}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderMeasurementsTab = () => (
        <div
            role="tabpanel"
            id="panel-measurements"
            aria-labelledby="tab-measurements"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-obsidian-700">
                    {customer.measurements.length} measurement profile{customer.measurements.length !== 1 ? "s" : ""}
                </h3>
                <Button
                    size="sm"
                    onClick={() => {
                        setEditingMeasurement(null)
                        setMeasurementDialogOpen(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Add Measurement
                </Button>
            </div>

            {customer.measurements.length === 0 ? (
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-8 text-center">
                    <Ruler className="w-8 h-8 text-obsidian-300 mx-auto mb-3" />
                    <p className="text-sm text-obsidian-500 mb-4">No measurements recorded yet.</p>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            setEditingMeasurement(null)
                            setMeasurementDialogOpen(true)
                        }}
                    >
                        Record First Measurement
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {customer.measurements.map((m) => (
                        <MeasurementCard
                            key={m.id}
                            measurement={m}
                            onEdit={() => {
                                setEditingMeasurement(m)
                                setMeasurementDialogOpen(true)
                            }}
                            onDelete={() => handleDeleteMeasurement(m.id)}
                        />
                    ))}
                </div>
            )}

            <CustomerMeasurementForm
                open={measurementDialogOpen}
                onOpenChange={setMeasurementDialogOpen}
                measurement={editingMeasurement}
                onSubmit={handleSaveMeasurement}
            />
        </div>
    )

    const renderInteractionsTab = () => (
        <div
            role="tabpanel"
            id="panel-interactions"
            aria-labelledby="tab-interactions"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-obsidian-700">
                    Interaction history
                </h3>
                <Button
                    size="sm"
                    onClick={() => setInteractionDialogOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Log Interaction
                </Button>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <CustomerInteractionTimeline
                    interactions={customer.customerInteractions}
                />
            </div>

            <LogInteractionDialog
                open={interactionDialogOpen}
                onOpenChange={setInteractionDialogOpen}
                onSubmit={handleLogInteraction}
            />
        </div>
    )

    const renderTicketsTab = () => (
        <div
            role="tabpanel"
            id="panel-tickets"
            aria-labelledby="tab-tickets"
        >
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Subject</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Priority</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Created</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {customer.tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-obsidian-500">
                                        No support tickets
                                    </td>
                                </tr>
                            ) : (
                                customer.tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-obsidian-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <a
                                                href={`/admin/tickets/${ticket.id}`}
                                                className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors"
                                            >
                                                {ticket.subject}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
                                                    TICKET_STATUS_COLORS[ticket.status] || ""
                                                }`}
                                            >
                                                {ticket.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority] || ""}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap">
                                            {formatDate(ticket.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap">
                                            {formatDate(ticket.updatedAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const tabPanels: Record<TabKey, () => React.JSX.Element> = {
        overview: renderOverviewTab,
        orders: renderOrdersTab,
        measurements: renderMeasurementsTab,
        interactions: renderInteractionsTab,
        tickets: renderTicketsTab,
    }

    return (
        <>
            {renderHeader()}
            {renderTabs()}
            {tabPanels[activeTab]()}
        </>
    )
}

// ---- Sub-components ----

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-obsidian-50 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-obsidian-500">{label}</p>
                    <p className="text-lg font-semibold text-obsidian-900 font-tabular mt-0.5">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    )
}

function MeasurementCard({
    measurement,
    onEdit,
    onDelete,
}: {
    measurement: CustomerMeasurement
    onEdit: () => void
    onDelete: () => void
}) {
    const fields: { label: string; key: keyof CustomerMeasurement; unit: string }[] = [
        { label: "Chest", key: "chest", unit: "cm" },
        { label: "Shoulder", key: "shoulder", unit: "cm" },
        { label: "Sleeve", key: "sleeveLength", unit: "cm" },
        { label: "Neck", key: "neck", unit: "cm" },
        { label: "Back", key: "backLength", unit: "cm" },
        { label: "Waist", key: "waist", unit: "cm" },
        { label: "Hip", key: "hip", unit: "cm" },
        { label: "Inseam", key: "inseam", unit: "cm" },
        { label: "Outseam", key: "outseam", unit: "cm" },
        { label: "Thigh", key: "thigh", unit: "cm" },
        { label: "Height", key: "height", unit: "cm" },
        { label: "Weight", key: "weight", unit: "kg" },
    ]

    const measuredFields = fields.filter((f) => measurement[f.key] != null)

    return (
        <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
            <div className="px-5 py-4 border-b border-obsidian-100 flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-obsidian-900">{measurement.label}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-obsidian-400">
                        {measurement.measuredBy && (
                            <span>by {measurement.measuredBy}</span>
                        )}
                        {measurement.measuredAt && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {formatDate(measurement.measuredAt)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="p-2 text-obsidian-400 hover:text-obsidian-700 hover:bg-obsidian-50 rounded-sm transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label={`Edit ${measurement.label} measurement`}
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-2 text-obsidian-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label={`Delete ${measurement.label} measurement`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="p-5">
                {measuredFields.length === 0 ? (
                    <p className="text-sm text-obsidian-400">No measurements recorded</p>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {measuredFields.map((f) => (
                            <div key={f.key}>
                                <p className="text-[11px] text-obsidian-400 uppercase tracking-wider">
                                    {f.label}
                                </p>
                                <p className="text-sm font-medium text-obsidian-900 font-tabular mt-0.5">
                                    {measurement[f.key] as number}
                                    <span className="text-obsidian-400 ml-0.5">{f.unit}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                {measurement.notes && (
                    <p className="mt-3 pt-3 border-t border-obsidian-100 text-sm text-obsidian-600">
                        {measurement.notes}
                    </p>
                )}
            </div>
        </div>
    )
}
