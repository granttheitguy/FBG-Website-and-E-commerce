"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"

interface ProfileFormProps {
    user: {
        id: string
        name: string
        email: string
        profile: {
            phone: string | null
            defaultShippingAddress: unknown
        } | null
    }
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    const defaultAddress = user.profile?.defaultShippingAddress
        ? (user.profile.defaultShippingAddress as { address: string; city: string; state: string; zip: string })
        : { address: "", city: "", state: "", zip: "" }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            phone: formData.get("phone"),
            address: {
                address: formData.get("address"),
                city: formData.get("city"),
                state: formData.get("state"),
                zip: formData.get("zip"),
            }
        }

        try {
            const response = await fetch("/api/account/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error("Failed to update profile")

            setMessage({ type: "success", text: "Profile updated successfully" })
            router.refresh()
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update profile. Please try again." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {message && (
                <div className={`p-4 rounded-sm text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {message.text}
                </div>
            )}

            {/* Personal Info */}
            <div>
                <h3 className="text-sm font-medium text-obsidian-900 mb-4 uppercase tracking-wider">Personal Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-obsidian-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            defaultValue={user.name}
                            required
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-obsidian-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            defaultValue={user.email}
                            disabled
                            className="w-full rounded-sm border-obsidian-200 bg-obsidian-50 text-obsidian-500 shadow-sm sm:text-sm py-2.5 px-3 border cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-obsidian-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            defaultValue={user.profile?.phone || ""}
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-obsidian-100 pt-8">
                <h3 className="text-sm font-medium text-obsidian-900 mb-4 uppercase tracking-wider">Default Shipping Address</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-obsidian-700 mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            defaultValue={defaultAddress.address}
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-obsidian-700 mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            id="city"
                            defaultValue={defaultAddress.city}
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-obsidian-700 mb-1">State</label>
                        <input
                            type="text"
                            name="state"
                            id="state"
                            defaultValue={defaultAddress.state}
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                    <div>
                        <label htmlFor="zip" className="block text-sm font-medium text-obsidian-700 mb-1">ZIP Code</label>
                        <input
                            type="text"
                            name="zip"
                            id="zip"
                            defaultValue={defaultAddress.zip}
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>
        </form>
    )
}
