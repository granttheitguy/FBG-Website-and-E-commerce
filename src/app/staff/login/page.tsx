"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Dumbbell, Lock } from "lucide-react"

export default function StaffLoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid credentials or insufficient permissions")
                setIsLoading(false)
                return
            }

            // Force redirect to staff dashboard
            router.push("/staff/dashboard")
            router.refresh()
        } catch (error) {
            setError("Authentication failed. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 font-sans antialiased">
            {/* Left Side: Staff Branding */}
            <div className="hidden lg:flex w-1/2 bg-emerald-950 relative overflow-hidden items-center justify-center p-12 lg:p-16">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10"></div>
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)`
                    }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-md">
                    <div className="mb-8 flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                            <Dumbbell className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Staff Portal
                    </h1>
                    <p className="text-emerald-300 text-lg mb-8">
                        Manage operations and support customers
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-emerald-400">
                        <div className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4" />
                            <span>Staff Hub</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-emerald-600"></div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Staff Only</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 bg-white relative overflow-y-auto">

                {/* Mobile Header */}
                <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">Staff Portal</span>
                </div>

                <div className="w-full max-w-sm space-y-8 py-10">

                    {/* Header */}
                    <div className="text-center sm:text-left">
                        <div className="mb-8">
                            <span className="text-xl tracking-tighter font-bold text-slate-900 font-serif">FASHION BY GRANT</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-4">
                            <Dumbbell className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Staff Access</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-4">Staff Portal</h1>
                        <p className="text-sm text-slate-500 mt-2">Sign in to access your staff dashboard.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm flex items-start gap-2">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSubmit}>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-sm text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                                placeholder="staff@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    required
                                    className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-sm text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-sm shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Sign in to Staff Portal
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info Notice */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4">
                        <p className="text-xs text-emerald-700 leading-relaxed">
                            <strong className="text-emerald-900">Staff Access:</strong> This portal is for staff members only.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-xs text-slate-400 tracking-wide">© 2024 Fashion By Grant - Staff Portal</p>
                </div>
            </div>
        </div>
    )
}
