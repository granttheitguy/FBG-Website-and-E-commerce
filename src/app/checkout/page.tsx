"use client"

import { useCart } from "@/context/CartContext"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, Lock, Check, ShieldCheck, Truck, CreditCard, Tag, X, Loader2 } from "lucide-react"

const NIGERIAN_STATES = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
    "Abuja FCT",
] as const

type CheckoutStep = "information" | "shipping" | "payment"

interface StepConfig {
    key: CheckoutStep
    label: string
    number: number
}

const CHECKOUT_STEPS: StepConfig[] = [
    { key: "information", label: "Information", number: 1 },
    { key: "shipping", label: "Shipping", number: 2 },
    { key: "payment", label: "Payment", number: 3 },
]

interface ShippingRate {
    id: string
    name: string
    price: number
    estimatedDays: string
}

interface ContactInfo {
    email: string
    phone: string
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zip: string
}

function CheckoutProgressIndicator({ currentStep }: { currentStep: CheckoutStep }) {
    const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.key === currentStep)

    return (
        <nav aria-label="Checkout progress" className="w-full max-w-md mx-auto py-6 px-4">
            <ol className="flex items-center w-full">
                {CHECKOUT_STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex
                    const isCurrent = index === currentIndex
                    const isFuture = index > currentIndex

                    return (
                        <li
                            key={step.key}
                            className={`flex items-center ${index < CHECKOUT_STEPS.length - 1 ? "flex-1" : ""}`}
                        >
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                        ${isCompleted ? "bg-gold-500 text-white" : ""}
                                        ${isCurrent ? "bg-obsidian-900 text-white" : ""}
                                        ${isFuture ? "bg-obsidian-100 text-obsidian-400 border border-obsidian-200" : ""}
                                    `}
                                    aria-current={isCurrent ? "step" : undefined}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4" strokeWidth={2.5} />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <span
                                    className={`
                                        mt-1.5 text-xs font-medium
                                        ${isCompleted ? "text-gold-600" : ""}
                                        ${isCurrent ? "text-obsidian-900" : ""}
                                        ${isFuture ? "text-obsidian-400" : ""}
                                    `}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < CHECKOUT_STEPS.length - 1 && (
                                <div
                                    className={`
                                        flex-1 h-px mx-3 mt-[-1rem]
                                        ${index < currentIndex ? "bg-gold-500" : "bg-obsidian-200"}
                                    `}
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [currentStep, setCurrentStep] = useState<CheckoutStep>("information")

    // Contact / shipping info
    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        zip: "",
    })

    // Shipping rates
    const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
    const [selectedShippingRateId, setSelectedShippingRateId] = useState("")
    const [shippingZoneName, setShippingZoneName] = useState("")
    const [loadingRates, setLoadingRates] = useState(false)

    // Coupon
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState("")

    // Pre-fill logged-in user details
    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch("/api/auth/session")
                if (res.ok) {
                    const session = await res.json()
                    if (session?.user) {
                        setContactInfo((prev) => ({
                            ...prev,
                            email: session.user.email || prev.email,
                            firstName: session.user.name?.split(" ")[0] || prev.firstName,
                            lastName: session.user.name?.split(" ").slice(1).join(" ") || prev.lastName,
                        }))
                    }
                }
            } catch {
                // Session fetch failed, continue as guest
            }
        }
        fetchSession()
    }, [])

    const selectedRate = shippingRates.find((r) => r.id === selectedShippingRateId)
    const shippingCost = selectedRate?.price ?? 0
    const orderTotal = cartTotal + shippingCost

    // Fetch shipping rates when state changes
    const fetchShippingRates = useCallback(async (state: string) => {
        if (!state) {
            setShippingRates([])
            setSelectedShippingRateId("")
            return
        }

        setLoadingRates(true)
        setError("")

        try {
            const res = await fetch(`/api/shipping/rates?state=${encodeURIComponent(state)}`)
            const json = await res.json()

            if (json.success && json.data.rates.length > 0) {
                setShippingRates(json.data.rates)
                setShippingZoneName(json.data.zone?.name ?? "")
                setSelectedShippingRateId(json.data.rates[0].id)
            } else {
                setShippingRates([])
                setSelectedShippingRateId("")
                setShippingZoneName("")
            }
        } catch {
            setError("Failed to fetch shipping rates. Please try again.")
            setShippingRates([])
        } finally {
            setLoadingRates(false)
        }
    }, [])

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold font-serif text-obsidian-900 mb-4">Your cart is empty</h1>
                    <p className="text-obsidian-500 mb-8">Add some items to your cart to proceed with checkout.</p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800 transition-colors"
                    >
                        Return to Shop
                    </Link>
                </div>
            </div>
        )
    }

    function handleContactChange(field: keyof ContactInfo, value: string) {
        setContactInfo((prev) => ({ ...prev, [field]: value }))
    }

    function validateInformation(): boolean {
        if (!contactInfo.email || !contactInfo.phone || !contactInfo.firstName ||
            !contactInfo.lastName || !contactInfo.address || !contactInfo.city || !contactInfo.state) {
            setError("Please fill in all required fields.")
            return false
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
            setError("Please enter a valid email address.")
            return false
        }
        setError("")
        return true
    }

    async function handleContinueToShipping() {
        if (!validateInformation()) return
        // Fetch shipping rates for the selected state
        await fetchShippingRates(contactInfo.state)
        setCurrentStep("shipping")
    }

    function handleContinueToPayment() {
        if (!selectedShippingRateId) {
            setError("Please select a shipping method.")
            return
        }
        setError("")
        setCurrentStep("payment")
    }

    async function handlePlaceOrder() {
        setIsSubmitting(true)
        setError("")

        try {
            const response = await fetch("/api/payments/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: contactInfo.email,
                    firstName: contactInfo.firstName,
                    lastName: contactInfo.lastName,
                    address: contactInfo.address,
                    city: contactInfo.city,
                    state: contactInfo.state,
                    zip: contactInfo.zip,
                    phone: contactInfo.phone,
                    items: items.map((item) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.name,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    shippingRateId: selectedShippingRateId,
                    couponCode: appliedCoupon || undefined,
                }),
            })

            const result = await response.json()

            if (!result.success) {
                const errorMessage = result.errors
                    ? (Array.isArray(result.errors) ? result.errors.join(". ") : Object.values(result.errors).flat().join(". "))
                    : result.message
                setError(errorMessage || "Failed to initialize payment")
                setIsSubmitting(false)
                return
            }

            // Clear cart before redirect
            clearCart()

            // Redirect to Paystack payment page
            window.location.href = result.data.authorization_url
        } catch {
            setError("Something went wrong. Please try again.")
            setIsSubmitting(false)
        }
    }

    function handleApplyCoupon() {
        if (couponCode.trim()) {
            setAppliedCoupon(couponCode.trim().toUpperCase())
            setCouponCode("")
        }
    }

    function handleRemoveCoupon() {
        setAppliedCoupon("")
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Checkout Header */}
            <header className="bg-surface-elevated border-b border-obsidian-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-obsidian-900">
                        <span className="text-xl font-semibold tracking-[0.12em] font-serif">FBG</span>
                    </Link>
                    <div className="flex items-center gap-2 text-obsidian-500 text-sm">
                        <Lock className="w-4 h-4" />
                        Secure Checkout
                    </div>
                </div>
            </header>

            {/* Progress Indicator */}
            <CheckoutProgressIndicator currentStep={currentStep} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                    {/* Order Summary (Mobile: Top, Desktop: Right) */}
                    <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200 mb-8 lg:mb-0 lg:sticky lg:top-8">
                        <h2 className="text-lg font-bold font-serif text-obsidian-900 mb-6">Order Summary</h2>
                        <ul className="divide-y divide-obsidian-100 mb-6">
                            {items.map((item) => (
                                <li key={item.id} className="py-4 flex gap-4">
                                    <div className="w-16 h-20 bg-obsidian-100 rounded-sm overflow-hidden flex-shrink-0">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-obsidian-900">{item.name}</h3>
                                        <p className="text-xs text-obsidian-500 mt-1">
                                            Size: {item.size} &middot; Qty: {item.quantity}
                                        </p>
                                        <p className="text-sm font-medium text-obsidian-900 mt-2">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Coupon Code */}
                        <div className="mb-6">
                            {appliedCoupon ? (
                                <div className="flex items-center justify-between bg-gold-50 border border-gold-200 px-3 py-2 rounded-sm">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Tag className="w-4 h-4 text-gold-600" />
                                        <span className="font-medium text-obsidian-900">{appliedCoupon}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        className="text-obsidian-400 hover:text-obsidian-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 text-sm py-2 px-3 border"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCode.trim()}
                                        className="px-4 py-2 bg-obsidian-900 text-white text-sm rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-obsidian-100 pt-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-600">Subtotal</span>
                                <span className="font-medium text-obsidian-900">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-obsidian-600">Shipping</span>
                                {selectedRate ? (
                                    <span className="font-medium text-obsidian-900">
                                        {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                                    </span>
                                ) : (
                                    <span className="text-obsidian-500">
                                        {currentStep === "information" ? "Calculated next step" : "Select a method"}
                                    </span>
                                )}
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gold-600">Coupon ({appliedCoupon})</span>
                                    <span className="text-gold-600">Applied at checkout</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-medium border-t border-obsidian-100 pt-4">
                                <span className="text-obsidian-900">Total</span>
                                <span className="text-obsidian-900">{formatCurrency(orderTotal)}</span>
                            </div>
                        </div>

                        {/* Trust Signals */}
                        <div className="mt-6 pt-6 border-t border-obsidian-100 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-obsidian-600">
                                <ShieldCheck className="w-4 h-4 text-gold-500 flex-shrink-0" />
                                <span>100% Secure Checkout</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-obsidian-600">
                                <Truck className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                                <span>3-5 business days within Lagos, 5-7 days interstate</span>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="lg:col-span-7 lg:row-start-1">
                        {/* Step 1: Information */}
                        {currentStep === "information" && (
                            <div className="space-y-8">
                                {/* Contact Info */}
                                <div className="bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200">
                                    <h2 className="text-lg font-bold font-serif text-obsidian-900 mb-4">
                                        Contact Information
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                Email address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={contactInfo.email}
                                                onChange={(e) => handleContactChange("email", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                Phone number
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={contactInfo.phone}
                                                onChange={(e) => handleContactChange("phone", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200">
                                    <h2 className="text-lg font-bold font-serif text-obsidian-900 mb-4">
                                        Shipping Address
                                    </h2>
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                First name
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                value={contactInfo.firstName}
                                                onChange={(e) => handleContactChange("firstName", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                Last name
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                value={contactInfo.lastName}
                                                onChange={(e) => handleContactChange("lastName", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="address" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                id="address"
                                                value={contactInfo.address}
                                                onChange={(e) => handleContactChange("address", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                id="city"
                                                value={contactInfo.city}
                                                onChange={(e) => handleContactChange("city", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="state" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                State
                                            </label>
                                            <select
                                                id="state"
                                                value={contactInfo.state}
                                                onChange={(e) => handleContactChange("state", e.target.value)}
                                                required
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border bg-white"
                                            >
                                                <option value="" disabled>
                                                    Select a state
                                                </option>
                                                {NIGERIAN_STATES.map((state) => (
                                                    <option key={state} value={state}>
                                                        {state}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="zip" className="block text-sm font-medium text-obsidian-700 mb-1">
                                                Postal Code (optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="zip"
                                                value={contactInfo.zip}
                                                onChange={(e) => handleContactChange("zip", e.target.value)}
                                                className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm" role="alert">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4">
                                    <Link
                                        href="/shop"
                                        className="flex items-center text-sm font-medium text-obsidian-600 hover:text-obsidian-900 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Return to Shop
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleContinueToShipping}
                                        className="bg-obsidian-900 text-white px-8 py-3 rounded-sm font-medium hover:bg-obsidian-800 transition-colors"
                                    >
                                        Continue to Shipping
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Shipping */}
                        {currentStep === "shipping" && (
                            <div className="space-y-8">
                                {/* Contact summary */}
                                <div className="bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm font-medium text-obsidian-500">Contact</h2>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep("information")}
                                            className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-sm text-obsidian-900">{contactInfo.email}</p>
                                    <hr className="my-3 border-obsidian-100" />
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm font-medium text-obsidian-500">Ship to</h2>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep("information")}
                                            className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-sm text-obsidian-900">
                                        {contactInfo.address}, {contactInfo.city}, {contactInfo.state}
                                    </p>
                                </div>

                                {/* Shipping Methods */}
                                <div className="bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200">
                                    <h2 className="text-lg font-bold font-serif text-obsidian-900 mb-4">
                                        Shipping Method
                                    </h2>

                                    {loadingRates ? (
                                        <div className="flex items-center justify-center py-8 text-obsidian-500">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            <span className="text-sm">Loading shipping options...</span>
                                        </div>
                                    ) : shippingRates.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Truck className="w-8 h-8 text-obsidian-300 mx-auto mb-3" />
                                            <p className="text-sm text-obsidian-500">
                                                No shipping options available for {contactInfo.state}.
                                            </p>
                                            <p className="text-xs text-obsidian-400 mt-1">
                                                Please contact us for shipping arrangements.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {shippingZoneName && (
                                                <p className="text-xs text-obsidian-400 mb-2">
                                                    Zone: {shippingZoneName}
                                                </p>
                                            )}
                                            {shippingRates.map((rate) => (
                                                <label
                                                    key={rate.id}
                                                    className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-colors ${
                                                        selectedShippingRateId === rate.id
                                                            ? "border-obsidian-900 bg-obsidian-50"
                                                            : "border-obsidian-200 hover:border-obsidian-300"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name="shippingRate"
                                                            value={rate.id}
                                                            checked={selectedShippingRateId === rate.id}
                                                            onChange={() => setSelectedShippingRateId(rate.id)}
                                                            className="text-obsidian-900 focus:ring-obsidian-900"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-obsidian-900">
                                                                {rate.name}
                                                            </p>
                                                            <p className="text-xs text-obsidian-500 mt-0.5">
                                                                {rate.estimatedDays} business days
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-obsidian-900">
                                                        {rate.price === 0 ? "Free" : formatCurrency(rate.price)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm" role="alert">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setError(""); setCurrentStep("information") }}
                                        className="flex items-center text-sm font-medium text-obsidian-600 hover:text-obsidian-900 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Return to Information
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContinueToPayment}
                                        disabled={!selectedShippingRateId || loadingRates}
                                        className="bg-obsidian-900 text-white px-8 py-3 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {currentStep === "payment" && (
                            <div className="space-y-8">
                                {/* Contact & Shipping summary */}
                                <div className="bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm font-medium text-obsidian-500">Contact</h2>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep("information")}
                                            className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-sm text-obsidian-900">{contactInfo.email}</p>
                                    <hr className="my-3 border-obsidian-100" />
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm font-medium text-obsidian-500">Ship to</h2>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep("information")}
                                            className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-sm text-obsidian-900">
                                        {contactInfo.address}, {contactInfo.city}, {contactInfo.state}
                                    </p>
                                    <hr className="my-3 border-obsidian-100" />
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm font-medium text-obsidian-500">Shipping method</h2>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep("shipping")}
                                            className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-sm text-obsidian-900">
                                        {selectedRate?.name} &middot;{" "}
                                        {selectedRate?.price === 0 ? "Free" : formatCurrency(selectedRate?.price ?? 0)}
                                    </p>
                                </div>

                                {/* Payment Section */}
                                <div className="bg-surface-elevated p-6 rounded-sm shadow-sm border border-obsidian-200">
                                    <h2 className="text-lg font-bold font-serif text-obsidian-900 mb-4">Payment</h2>
                                    <div className="bg-surface-secondary p-5 rounded-sm border border-obsidian-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Lock className="w-4 h-4 text-gold-500" />
                                            <span className="text-sm font-medium text-obsidian-900">
                                                Secured by Paystack
                                            </span>
                                        </div>
                                        <p className="text-sm text-obsidian-600 mb-3">
                                            You will be redirected to Paystack to complete your payment securely.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-obsidian-500">
                                            <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>We accept Visa, Mastercard, Verve, bank transfer, and USSD</span>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm" role="alert">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => { setError(""); setCurrentStep("shipping") }}
                                            className="flex items-center text-sm font-medium text-obsidian-600 hover:text-obsidian-900 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Return to Shipping
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePlaceOrder}
                                            disabled={isSubmitting}
                                            className="bg-obsidian-900 text-white px-8 py-3 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                `Pay ${formatCurrency(orderTotal)}`
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-obsidian-500 text-right">
                                        By placing your order, you agree to our{" "}
                                        <Link href="/terms" className="underline hover:text-obsidian-700">
                                            Terms and Conditions
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
