"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2, Save } from "lucide-react"

export default function NewUserPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: formData.get("role"),
        }

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || "Failed to create user")
            }

            router.push("/admin/users")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/users" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Add New User</h1>
                    <p className="text-sm text-obsidian-500">Create a new staff member or administrator.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-obsidian-200 rounded-sm shadow-sm p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-obsidian-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
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
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-obsidian-700 mb-1">Temporary Password</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        required
                        minLength={8}
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                    <p className="text-xs text-obsidian-500 mt-1">Must be at least 8 characters.</p>
                </div>

                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-obsidian-700 mb-1">Role</label>
                    <select
                        name="role"
                        id="role"
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="CUSTOMER">Customer</option>
                    </select>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Create User
                    </button>
                </div>
            </form>
        </div>
    )
}
