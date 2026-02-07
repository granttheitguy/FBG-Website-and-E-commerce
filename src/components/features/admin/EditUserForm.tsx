"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2, Save, Trash2 } from "lucide-react"

interface EditUserPageProps {
    user: {
        id: string
        name: string
        email: string
        role: string
        status: string
    }
}

export default function EditUserForm({ user }: EditUserPageProps) {
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
            role: formData.get("role"),
            status: formData.get("status"),
            password: formData.get("password") || undefined, // Only send if provided
        }

        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || "Failed to update user")
            }

            router.push("/admin/users")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete user")
            }

            router.push("/admin/users")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-medium text-obsidian-900">Edit User</h1>
                        <p className="text-sm text-obsidian-500">Update user details and permissions.</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    type="button"
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-red-50 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete User
                </button>
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
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-obsidian-700 mb-1">New Password (Optional)</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        minLength={8}
                        placeholder="Leave blank to keep current password"
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-obsidian-700 mb-1">Role</label>
                        <select
                            name="role"
                            id="role"
                            defaultValue={user.role}
                            required
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        >
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="CUSTOMER">Customer</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-obsidian-700 mb-1">Status</label>
                        <select
                            name="status"
                            id="status"
                            defaultValue={user.status}
                            required
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
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
        </div>
    )
}
