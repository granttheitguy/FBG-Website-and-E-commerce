"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStoreSettings } from "./actions"
import { Loader2 } from "lucide-react"

interface StoreSettingsFormProps {
    settings: {
        id: string
        storeName: string
        storeEmail: string | null
        storePhone: string | null
        whatsappNumber: string | null
        storeAddress: string | null
        logoUrl: string | null
        socialLinks: string | null
        currency: string
    }
}

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const socialLinks = settings.socialLinks ? JSON.parse(settings.socialLinks) : {}

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await updateStoreSettings(formData)

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <input type="hidden" name="id" value={settings.id} />

            {/* Basic Information */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-obsidian-900 border-b border-obsidian-200 pb-2">
                    Basic Information
                </h2>

                <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                        id="storeName"
                        name="storeName"
                        defaultValue={settings.storeName}
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                        id="logoUrl"
                        name="logoUrl"
                        type="url"
                        defaultValue={settings.logoUrl ?? ""}
                        placeholder="https://example.com/logo.png"
                    />
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-obsidian-900 border-b border-obsidian-200 pb-2">
                    Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="storeEmail">Store Email</Label>
                        <Input
                            id="storeEmail"
                            name="storeEmail"
                            type="email"
                            defaultValue={settings.storeEmail ?? ""}
                            placeholder="info@example.com"
                        />
                    </div>

                    <div>
                        <Label htmlFor="storePhone">Store Phone</Label>
                        <Input
                            id="storePhone"
                            name="storePhone"
                            defaultValue={settings.storePhone ?? ""}
                            placeholder="+234 800 000 0000"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                        id="whatsappNumber"
                        name="whatsappNumber"
                        defaultValue={settings.whatsappNumber ?? ""}
                        placeholder="+234 800 000 0000"
                    />
                </div>

                <div>
                    <Label htmlFor="storeAddress">Store Address</Label>
                    <textarea
                        id="storeAddress"
                        name="storeAddress"
                        defaultValue={settings.storeAddress ?? ""}
                        rows={2}
                        className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        placeholder="Store address"
                    />
                </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-obsidian-900 border-b border-obsidian-200 pb-2">
                    Social Media
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                            id="instagram"
                            name="instagram"
                            defaultValue={socialLinks.instagram ?? ""}
                            placeholder="@fashionbygrant"
                        />
                    </div>

                    <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                            id="facebook"
                            name="facebook"
                            defaultValue={socialLinks.facebook ?? ""}
                            placeholder="Fashion By Grant"
                        />
                    </div>

                    <div>
                        <Label htmlFor="twitter">Twitter/X</Label>
                        <Input
                            id="twitter"
                            name="twitter"
                            defaultValue={socialLinks.twitter ?? ""}
                            placeholder="@fashionbygrant"
                        />
                    </div>

                    <div>
                        <Label htmlFor="tiktok">TikTok</Label>
                        <Input
                            id="tiktok"
                            name="tiktok"
                            defaultValue={socialLinks.tiktok ?? ""}
                            placeholder="@fashionbygrant"
                        />
                    </div>
                </div>
            </div>

            {/* Regional Settings */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-obsidian-900 border-b border-obsidian-200 pb-2">
                    Regional Settings
                </h2>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                        id="currency"
                        name="currency"
                        defaultValue={settings.currency}
                        className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    >
                        <option value="NGN">Nigerian Naira (₦)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="GBP">British Pound (£)</option>
                        <option value="EUR">Euro (€)</option>
                    </select>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-sm text-sm">
                    Settings updated successfully!
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-obsidian-200">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
