"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const router = useRouter()

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("Verifying your email...")

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setMessage("Invalid verification link.")
            return
        }

        async function verify() {
            try {
                const response = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                })

                const result = await response.json()

                if (!response.ok) {
                    setStatus("error")
                    setMessage(result.error || "Verification failed.")
                } else {
                    setStatus("success")
                    setMessage("Email verified successfully!")
                    // Redirect to login after 3 seconds
                    setTimeout(() => router.push("/login"), 3000)
                }
            } catch (error) {
                setStatus("error")
                setMessage("Something went wrong. Please try again.")
            }
        }

        verify()
    }, [token, router])

    return (
        <div className="text-center">
            {status === "loading" && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-obsidian-900 animate-spin mb-4" />
                    <h2 className="text-xl font-medium text-obsidian-900">{message}</h2>
                </div>
            )}

            {status === "success" && (
                <div className="flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                    <h2 className="text-xl font-medium text-obsidian-900 mb-2">Verified!</h2>
                    <p className="text-obsidian-500 mb-6">{message}</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-sm text-white bg-obsidian-900 hover:bg-obsidian-800"
                    >
                        Go to Login
                    </Link>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center">
                    <XCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-medium text-obsidian-900 mb-2">Verification Failed</h2>
                    <p className="text-obsidian-500 mb-6">{message}</p>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-obsidian-900 hover:underline"
                    >
                        Back to Login
                    </Link>
                </div>
            )}
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-sm border border-obsidian-200">
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    )
}
