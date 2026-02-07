"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, XCircle, Mail, Truck, Loader2, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface OrderItem {
    name: string
    sku: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

interface OrderDetails {
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
    subtotal: number
    shippingCost: number
    couponDiscount: number
    total: number
    currency: string
    items: OrderItem[]
    shippingAddress: {
        firstName: string
        lastName: string
        address: string
        city: string
        state: string
    } | null
    paidAt: string | null
}

type VerificationState = "loading" | "success" | "failed" | "error"

export default function OrderSuccessPage() {
    const searchParams = useSearchParams()
    const reference = searchParams.get("reference")

    const [state, setState] = useState<VerificationState>("loading")
    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [message, setMessage] = useState("")

    useEffect(() => {
        if (!reference) {
            setState("error")
            setMessage("No payment reference found.")
            return
        }

        async function verifyPayment() {
            try {
                const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference!)}`)
                const json = await res.json()

                if (json.success && json.data?.order) {
                    setState("success")
                    setOrder(json.data.order)
                    setMessage(json.message)
                } else {
                    setState("failed")
                    setMessage(json.message || "Payment verification failed.")
                }
            } catch {
                setState("error")
                setMessage("An error occurred while verifying your payment. Please contact support.")
            }
        }

        verifyPayment()
    }, [reference])

    // Loading state
    if (state === "loading") {
        return (
            <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-4">
                <div className="bg-surface-elevated p-8 rounded-sm shadow-sm border border-obsidian-200 max-w-md w-full text-center">
                    <Loader2 className="w-12 h-12 text-obsidian-400 animate-spin mx-auto mb-6" />
                    <h1 className="text-xl font-bold font-serif text-obsidian-900 mb-2">
                        Verifying Payment
                    </h1>
                    <p className="text-obsidian-500 text-sm">
                        Please wait while we confirm your payment...
                    </p>
                </div>
            </div>
        )
    }

    // Error state (no reference, network error)
    if (state === "error") {
        return (
            <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-4">
                <div className="bg-surface-elevated p-8 rounded-sm shadow-sm border border-obsidian-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold font-serif text-obsidian-900 mb-2">
                        Something Went Wrong
                    </h1>
                    <p className="text-obsidian-500 text-sm mb-6">{message}</p>
                    <div className="space-y-3">
                        <Link
                            href="/account/orders"
                            className="block w-full bg-obsidian-900 text-white py-3 rounded-sm font-medium hover:bg-obsidian-800 transition-colors text-center"
                        >
                            View My Orders
                        </Link>
                        <Link
                            href="/"
                            className="block w-full text-sm font-medium text-obsidian-600 hover:text-obsidian-900 py-2 transition-colors text-center"
                        >
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Failed state (payment failed/abandoned)
    if (state === "failed") {
        return (
            <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-4">
                <div className="bg-surface-elevated p-8 rounded-sm shadow-sm border border-obsidian-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold font-serif text-obsidian-900 mb-2">
                        Payment Not Completed
                    </h1>
                    <p className="text-obsidian-500 text-sm mb-6">{message}</p>

                    <div className="bg-surface-secondary p-4 rounded-sm border border-obsidian-100 mb-6 text-left">
                        <p className="text-sm text-obsidian-600">
                            If money was deducted from your account, it will be automatically refunded
                            within 24 hours. If you continue to experience issues, please contact our
                            support team.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/shop"
                            className="block w-full bg-obsidian-900 text-white py-3 rounded-sm font-medium hover:bg-obsidian-800 transition-colors text-center"
                        >
                            Return to Shop
                        </Link>
                        <Link
                            href="/account/orders"
                            className="block w-full text-sm font-medium text-obsidian-600 hover:text-obsidian-900 py-2 transition-colors text-center"
                        >
                            View My Orders
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Success state
    return (
        <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-4">
            <div className="bg-surface-elevated p-8 rounded-sm shadow-sm border border-obsidian-200 max-w-lg w-full">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-obsidian-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-gold-500" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold font-serif text-obsidian-900 mb-2">
                        Thank You for Your Order
                    </h1>
                    <p className="text-obsidian-500">
                        Your order has been confirmed and is being processed.
                    </p>
                </div>

                {/* Order Number */}
                <div className="bg-surface-secondary p-4 rounded-sm border border-obsidian-100 mb-6 text-center">
                    <p className="text-sm text-obsidian-600">Order Number</p>
                    <p className="text-lg font-tabular font-bold text-obsidian-900 mt-1">
                        {order?.orderNumber}
                    </p>
                </div>

                {/* Order Items */}
                {order?.items && order.items.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-obsidian-700 mb-3">Items Ordered</h3>
                        <ul className="divide-y divide-obsidian-100">
                            {order.items.map((item, index) => (
                                <li key={index} className="py-3 flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-obsidian-900">{item.name}</p>
                                        <p className="text-xs text-obsidian-500 mt-0.5">
                                            Qty: {item.quantity} x {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-obsidian-900">
                                        {formatCurrency(item.totalPrice)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Order Totals */}
                <div className="border-t border-obsidian-100 pt-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-obsidian-600">Subtotal</span>
                        <span className="text-obsidian-900">{formatCurrency(order?.subtotal ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-obsidian-600">Shipping</span>
                        <span className="text-obsidian-900">{formatCurrency(order?.shippingCost ?? 0)}</span>
                    </div>
                    {(order?.couponDiscount ?? 0) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gold-600">Discount</span>
                            <span className="text-gold-600">-{formatCurrency(order?.couponDiscount ?? 0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-obsidian-100 pt-2">
                        <span className="text-obsidian-900">Total</span>
                        <span className="text-obsidian-900">{formatCurrency(order?.total ?? 0)}</span>
                    </div>
                </div>

                {/* Shipping Address */}
                {order?.shippingAddress && (
                    <div className="bg-surface-secondary p-4 rounded-sm border border-obsidian-100 mb-6">
                        <p className="text-sm font-medium text-obsidian-700 mb-1">Shipping to</p>
                        <p className="text-sm text-obsidian-600">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                        <p className="text-sm text-obsidian-600">
                            {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}
                        </p>
                    </div>
                )}

                {/* Info Messages */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-center gap-2 text-sm text-obsidian-600">
                        <Truck className="w-4 h-4 text-gold-500 flex-shrink-0" />
                        <span>We will notify you when your order ships</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-obsidian-500">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span>A confirmation email has been sent to your inbox</span>
                    </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                    <Link
                        href={`/account/orders`}
                        className="block w-full bg-obsidian-900 text-white py-3 rounded-sm font-medium hover:bg-obsidian-800 transition-colors text-center"
                    >
                        View My Orders
                    </Link>
                    <Link
                        href="/shop"
                        className="block w-full text-sm font-medium text-obsidian-600 hover:text-obsidian-900 py-2 transition-colors text-center"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}
