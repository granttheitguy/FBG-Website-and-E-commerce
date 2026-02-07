"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, UserCog, Lock } from "lucide-react"

export default function AdminLoginPage() {
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

            // Force redirect to admin dashboard
            router.push("/admin/dashboard")
            router.refresh()
        } catch (error) {
            setError("Authentication failed. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 font-sans antialiased">
            {/* Left Side: Admin Branding */}
            <div className="hidden lg:flex w-1/2 bg-indigo-950 relative overflow-hidden items-center justify-center p-12 lg:p-16">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10"></div>
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-md">
                    <div className="mb-8 flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                            <UserCog className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Admin Portal
                    </h1>
                    <p className="text-indigo-300 text-lg mb-8">
                        Manage your platform with ease
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-indigo-400">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span>System Online</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-indigo-600"></div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Secure Access</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 bg-white relative overflow-y-auto">

                {/* Mobile Header */}
                <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                        <UserCog className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">Admin Portal</span>
                </div>

                <div className="w-full max-w-sm space-y-8 py-10">

                    {/* Header */}
                    <div className="text-center sm:text-left">
                        <div className="mb-8">
                            <span className="text-xl tracking-tighter font-bold text-slate-900 font-serif">FASHION BY GRANT</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full mb-4">
                            <UserCog className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Admin Access</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-4">Platform Administration</h1>
                        <p className="text-sm text-slate-500 mt-2">Sign in to manage your platform.</p>
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
                                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-sm text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                                placeholder="admin@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    required
                                    className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-sm text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
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
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-sm shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    Sign in to Admin Portal
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info Notice */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-4">
                        <p className="text-xs text-indigo-700 leading-relaxed">
                            <strong className="text-indigo-900">Admin Access:</strong> This portal is for platform administrators. Access is restricted and monitored.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-xs text-slate-400 tracking-wide">© 2024 Fashion By Grant - Admin Portal</p>
                </div>
            </div>
        </div>
    )
}
