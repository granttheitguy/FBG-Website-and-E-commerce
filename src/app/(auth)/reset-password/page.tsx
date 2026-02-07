"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="text-center">
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm mb-4">
                    Invalid or missing reset token.
                </div>
                <Link href="/forgot-password" className="text-sm font-medium text-obsidian-900 hover:underline">
                    Request a new link
                </Link>
            </div>
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || "Something went wrong")
                setIsLoading(false)
                return
            }

            setSuccess(true)
            setIsLoading(false)
            setTimeout(() => router.push("/login"), 3000)
        } catch (error) {
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-sm text-sm mb-4">
                    Password reset successfully! Redirecting to login...
                </div>
                <Link href="/login" className="text-sm font-medium text-obsidian-900 hover:underline">
                    Click here if not redirected
                </Link>
            </div>
        )
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-obsidian-700 mb-1">New Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="appearance-none rounded-sm relative block w-full px-3 py-2.5 border border-obsidian-300 placeholder-obsidian-500 text-obsidian-900 focus:outline-none focus:ring-gold-500 focus:border-obsidian-900 sm:text-sm"
                            placeholder="New Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-obsidian-400 hover:text-obsidian-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-obsidian-700 mb-1">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className="appearance-none rounded-sm relative block w-full px-3 py-2.5 border border-obsidian-300 placeholder-obsidian-500 text-obsidian-900 focus:outline-none focus:ring-gold-500 focus:border-obsidian-900 sm:text-sm"
                        placeholder="Confirm Password"
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Resetting..." : "Reset Password"}
                </button>
            </div>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-sm shadow-sm border border-obsidian-200">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-obsidian-900 font-serif">
                        Set New Password
                    </h2>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
