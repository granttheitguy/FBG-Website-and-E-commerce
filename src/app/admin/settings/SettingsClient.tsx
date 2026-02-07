"use client"

import { useState, useTransition } from "react"
import { Save, Check, AlertCircle } from "lucide-react"

interface SafeStoreSettings {
    id: string
    storeName: string
    storeEmail: string | null
    storePhone: string | null
    storeAddress: string | null
    currency: string
    paystackPublicKey: string | null
    whatsappNumber: string | null
    socialLinks: string | null
    freeShippingThreshold: number | null
    logoUrl: string | null
    faviconUrl: string | null
    hasPaystackSecretKey: boolean
    createdAt: Date
    updatedAt: Date
}

interface SettingsClientProps {
    initialSettings: SafeStoreSettings
}

interface SocialLinks {
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Parse social links from JSON
    const parsedSocialLinks: SocialLinks = initialSettings.socialLinks
        ? JSON.parse(initialSettings.socialLinks)
        : {}

    // Form state
    const [storeName, setStoreName] = useState(initialSettings.storeName)
    const [storeEmail, setStoreEmail] = useState(initialSettings.storeEmail || "")
    const [storePhone, setStorePhone] = useState(initialSettings.storePhone || "")
    const [storeAddress, setStoreAddress] = useState(initialSettings.storeAddress || "")
    const [currency, setCurrency] = useState(initialSettings.currency)
    const [paystackPublicKey, setPaystackPublicKey] = useState(initialSettings.paystackPublicKey || "")
    const [paystackSecretKey, setPaystackSecretKey] = useState("")
    const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber || "")
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(
        initialSettings.freeShippingThreshold?.toString() || ""
    )
    const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || "")
    const [faviconUrl, setFaviconUrl] = useState(initialSettings.faviconUrl || "")

    // Social links state
    const [facebook, setFacebook] = useState(parsedSocialLinks.facebook || "")
    const [instagram, setInstagram] = useState(parsedSocialLinks.instagram || "")
    const [twitter, setTwitter] = useState(parsedSocialLinks.twitter || "")
    const [tiktok, setTiktok] = useState(parsedSocialLinks.tiktok || "")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        startTransition(async () => {
            try {
                const socialLinksData: SocialLinks = {}
                if (facebook) socialLinksData.facebook = facebook
                if (instagram) socialLinksData.instagram = instagram
                if (twitter) socialLinksData.twitter = twitter
                if (tiktok) socialLinksData.tiktok = tiktok

                const payload: any = {
                    storeName,
                    storeEmail: storeEmail || undefined,
                    storePhone: storePhone || undefined,
                    storeAddress: storeAddress || undefined,
                    currency,
                    paystackPublicKey: paystackPublicKey || undefined,
                    whatsappNumber: whatsappNumber || undefined,
                    socialLinks: Object.keys(socialLinksData).length > 0 ? JSON.stringify(socialLinksData) : undefined,
                    freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : undefined,
                    logoUrl: logoUrl || undefined,
                    faviconUrl: faviconUrl || undefined,
                }

                // Only include secret key if it's been changed
                if (paystackSecretKey) {
                    payload.paystackSecretKey = paystackSecretKey
                }

                const res = await fetch("/api/admin/store-settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to update settings")
                }

                setSuccess(true)
                setPaystackSecretKey("") // Clear secret key field after save

                setTimeout(() => setSuccess(false), 3000)
            } catch (err: any) {
                setError(err.message || "An error occurred")
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <h2 className="text-lg font-medium text-obsidian-900 mb-4">General Information</h2>
                <div className="grid gap-5">
                    <div>
                        <label htmlFor="storeName" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Store Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="storeName"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                            required
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="storeEmail" className="block text-sm font-medium text-obsidian-700 mb-2">
                                Store Email
                            </label>
                            <input
                                type="email"
                                id="storeEmail"
                                value={storeEmail}
                                onChange={(e) => setStoreEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                                placeholder="hello@fashionbygrant.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="storePhone" className="block text-sm font-medium text-obsidian-700 mb-2">
                                Store Phone
                            </label>
                            <input
                                type="tel"
                                id="storePhone"
                                value={storePhone}
                                onChange={(e) => setStorePhone(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                                placeholder="+234 800 123 4567"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="storeAddress" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Store Address
                        </label>
                        <textarea
                            id="storeAddress"
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors resize-none text-sm"
                            placeholder="No 15, Station Road, Off Lagos-Abeokuta Expressway..."
                        />
                    </div>

                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Currency
                        </label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm bg-white"
                        >
                            <option value="NGN">NGN (Nigerian Naira)</option>
                            <option value="USD">USD (US Dollar)</option>
                            <option value="GBP">GBP (British Pound)</option>
                            <option value="EUR">EUR (Euro)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <h2 className="text-lg font-medium text-obsidian-900 mb-4">Payment Settings</h2>
                <div className="grid gap-5">
                    <div>
                        <label htmlFor="paystackPublicKey" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Paystack Public Key
                        </label>
                        <input
                            type="text"
                            id="paystackPublicKey"
                            value={paystackPublicKey}
                            onChange={(e) => setPaystackPublicKey(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm font-mono"
                            placeholder="pk_test_..."
                        />
                    </div>

                    <div>
                        <label htmlFor="paystackSecretKey" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Paystack Secret Key
                        </label>
                        <input
                            type="password"
                            id="paystackSecretKey"
                            value={paystackSecretKey}
                            onChange={(e) => setPaystackSecretKey(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm font-mono"
                            placeholder={initialSettings.hasPaystackSecretKey ? "••••••••••••" : "sk_test_..."}
                        />
                        {initialSettings.hasPaystackSecretKey && (
                            <p className="mt-2 text-xs text-obsidian-500 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-green-600" />
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                    Configured
                                </span>
                                <span className="ml-1">Leave blank to keep current key</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipping Settings */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <h2 className="text-lg font-medium text-obsidian-900 mb-4">Shipping Settings</h2>
                <div>
                    <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-obsidian-700 mb-2">
                        Free Shipping Threshold (₦)
                    </label>
                    <input
                        type="number"
                        id="freeShippingThreshold"
                        value={freeShippingThreshold}
                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                        placeholder="50000"
                        min="0"
                        step="0.01"
                    />
                    <p className="mt-2 text-xs text-obsidian-500">
                        Orders above this amount will qualify for free shipping
                    </p>
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <h2 className="text-lg font-medium text-obsidian-900 mb-4">Social & Contact</h2>
                <div className="grid gap-5">
                    <div>
                        <label htmlFor="whatsappNumber" className="block text-sm font-medium text-obsidian-700 mb-2">
                            WhatsApp Number
                        </label>
                        <input
                            type="tel"
                            id="whatsappNumber"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                            placeholder="+234 800 123 4567"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="facebook" className="block text-sm font-medium text-obsidian-700 mb-2">
                                Facebook URL
                            </label>
                            <input
                                type="url"
                                id="facebook"
                                value={facebook}
                                onChange={(e) => setFacebook(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                                placeholder="https://facebook.com/..."
                            />
                        </div>

                        <div>
                            <label htmlFor="instagram" className="block text-sm font-medium text-obsidian-700 mb-2">
                                Instagram URL
                            </label>
                            <input
                                type="url"
                                id="instagram"
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                                placeholder="https://instagram.com/..."
                            />
                        </div>

                        <div>
                            <label htmlFor="twitter" className="block text-sm font-medium text-obsidian-700 mb-2">
                                Twitter/X URL
                            </label>
                            <input
                                type="url"
                                id="twitter"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                                placeholder="https://twitter.com/..."
                            />
                        </div>

                        <div>
                            <label htmlFor="tiktok" className="block text-sm font-medium text-obsidian-700 mb-2">
                                TikTok URL
                            </label>
                            <input
                                type="url"
                                id="tiktok"
                                value={tiktok}
                                onChange={(e) => setTiktok(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                                placeholder="https://tiktok.com/@..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Branding */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <h2 className="text-lg font-medium text-obsidian-900 mb-4">Branding</h2>
                <div className="grid gap-5">
                    <div>
                        <label htmlFor="logoUrl" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Logo URL
                        </label>
                        <input
                            type="url"
                            id="logoUrl"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                            placeholder="https://..."
                        />
                        <p className="mt-2 text-xs text-obsidian-500">
                            This feature is not yet implemented. URL will be stored for future use.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="faviconUrl" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Favicon URL
                        </label>
                        <input
                            type="url"
                            id="faviconUrl"
                            value={faviconUrl}
                            onChange={(e) => setFaviconUrl(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-sm"
                            placeholder="https://..."
                        />
                        <p className="mt-2 text-xs text-obsidian-500">
                            This feature is not yet implemented. URL will be stored for future use.
                        </p>
                    </div>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-900">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-sm p-4 flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-900">Success</p>
                        <p className="text-sm text-green-700 mt-1">Settings updated successfully</p>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
