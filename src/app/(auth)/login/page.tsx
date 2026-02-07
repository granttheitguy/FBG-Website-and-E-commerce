"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function CustomerLoginPage() {
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
                setError("Invalid email or password")
                setIsLoading(false)
                return
            }

            // Force redirect to customer account dashboard
            router.push("/account/dashboard")
            router.refresh()
        } catch (error) {
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex w-full overflow-hidden bg-white font-sans antialiased text-obsidian-900">
            {/* Left Side: Editorial Image (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 bg-surface-secondary relative overflow-hidden items-end p-12 lg:p-16">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/auth-login.jpg"
                        className="w-full h-full object-cover opacity-95"
                        alt="Editorial Fashion"
                    />
                    <div className="absolute inset-0 bg-obsidian-950/10 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/60 via-transparent to-transparent"></div>
                </div>

                {/* Editorial Caption */}
                <div className="relative z-10 text-white w-full">
                    <h2 className="text-4xl font-medium tracking-tight leading-tight mb-4 font-serif">
                        Curated styles for<br />the modern era.
                    </h2>
                    <div className="flex items-center justify-between border-t border-white/30 pt-6 mt-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/90">Fall / Winter</p>
                            <p className="text-xs text-white/70 mt-1">Lookbook 2024</p>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 bg-white relative overflow-y-auto">

                {/* Top Right Navigation */}
                <div className="absolute top-8 right-8 flex items-center gap-6">
                    <Link href="/" className="text-xs font-medium text-obsidian-500 hover:text-obsidian-900 transition-colors">
                        Help
                    </Link>
                    <Link href="/signup" className="text-xs font-medium text-obsidian-900 hover:underline underline-offset-4">
                        Join Now
                    </Link>
                </div>

                <div className="w-full max-w-sm space-y-8 py-10">

                    {/* Header */}
                    <div className="text-center sm:text-left">
                        <div className="mb-8">
                            <span className="text-xl tracking-[0.12em] font-semibold text-obsidian-900 font-serif">FASHION BY GRANT</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-obsidian-900 font-serif" style={{ letterSpacing: '-0.02em' }}>Customer Login</h1>
                        <p className="text-sm text-obsidian-500 mt-2">Welcome back. Sign in to your account.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-xs font-medium text-obsidian-700">Email address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="block w-full px-3 py-2.5 bg-white border border-obsidian-200 rounded-sm text-sm shadow-sm placeholder-obsidian-400 focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 transition-all duration-200"
                                placeholder="name@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-xs font-medium text-obsidian-700">Password</label>
                                <Link href="/forgot-password" className="text-xs text-obsidian-500 hover:text-obsidian-900 transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    required
                                    className="block w-full px-3 py-2.5 bg-white border border-obsidian-200 rounded-sm text-sm shadow-sm placeholder-obsidian-400 focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 transition-all duration-200"
                                    placeholder="••••••••"
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

                        {/* Actions */}
                        <div className="flex items-center pt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input type="checkbox" id="remember" className="w-4 h-4 rounded-sm border-obsidian-300 text-obsidian-900 focus:ring-gold-500" />
                                <span className="text-xs text-obsidian-600 group-hover:text-obsidian-900 transition-colors select-none">Keep me signed in</span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-obsidian-900 hover:bg-obsidian-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    {/* Footer for Form */}
                    <p className="text-center text-xs text-obsidian-500">
                        New to Fashion by Grant?{" "}
                        <Link href="/signup" className="font-semibold text-obsidian-900 hover:underline underline-offset-2">
                            Create an account
                        </Link>
                    </p>
                </div>

                {/* Mobile Footer */}
                <div className="absolute bottom-6 w-full text-center lg:hidden">
                    <p className="text-[10px] text-obsidian-400 tracking-wide">© 2024 FBG INC.</p>
                </div>
            </div>
        </div>
    )
}
