"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setMessage("")
        setError("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || "Something went wrong")
                setIsLoading(false)
                return
            }

            setMessage("If an account exists with that email, we've sent a password reset link.")
            setIsLoading(false)
        } catch (error) {
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-sm shadow-sm border border-obsidian-200">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-obsidian-900 font-serif">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-obsidian-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-sm text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-sm relative block w-full px-3 py-2.5 border border-obsidian-300 placeholder-obsidian-500 text-obsidian-900 focus:outline-none focus:ring-gold-500 focus:border-obsidian-900 focus:z-10 sm:text-sm"
                            placeholder="Email address"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <Link href="/login" className="inline-flex items-center text-sm font-medium text-obsidian-600 hover:text-obsidian-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
