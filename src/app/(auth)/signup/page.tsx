"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [passwordStrength, setPasswordStrength] = useState(0)

    function calculatePasswordStrength(password: string) {
        let strength = 0
        if (password.length >= 8) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++
        setPasswordStrength(strength)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || "Something went wrong")
                setIsLoading(false)
                return
            }

            // Redirect to login
            router.push("/login?registered=true")
        } catch (error) {
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex w-full overflow-hidden bg-white font-sans antialiased text-obsidian-900">
            {/* Left Side: Editorial Image (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 bg-obsidian-100 relative overflow-hidden items-end p-12 lg:p-16">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/auth-signup.jpg"
                        className="w-full h-full object-cover opacity-95 grayscale-[20%]"
                        alt="Editorial Fashion"
                    />
                    <div className="absolute inset-0 bg-obsidian-900/20 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-obsidian-950/10 to-transparent"></div>
                </div>

                <div className="relative z-10 text-white w-full">
                    <h2 className="text-4xl font-medium tracking-tight leading-tight mb-4 font-serif">
                        Join the<br />exclusive collective.
                    </h2>
                    <div className="flex items-center justify-between border-t border-white/30 pt-6 mt-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-white/90">Early Access</p>
                            <p className="text-xs text-white/70 mt-1">Spring Collection Preview</p>
                        </div>
                        <div className="flex -space-x-3">
                            <div className="w-8 h-8 rounded-full border border-white/30 bg-obsidian-200 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=64&h=64" className="w-full h-full object-cover" alt="Member" />
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/30 bg-obsidian-300 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=64&h=64" className="w-full h-full object-cover" alt="Member" />
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/30 bg-obsidian-800 flex items-center justify-center text-[10px] text-white">
                                +2k
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Sign Up Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 bg-white relative overflow-y-auto">

                <div className="absolute top-8 right-8 flex items-center gap-6">
                    <Link href="/" className="text-xs font-medium text-obsidian-500 hover:text-obsidian-900 transition-colors">
                        Help
                    </Link>
                </div>

                <div className="w-full max-w-sm space-y-8 py-10">

                    <div className="text-center sm:text-left">
                        <div className="mb-8">
                            <span className="text-xl tracking-[0.12em] font-semibold text-obsidian-900 font-serif">FASHION BY GRANT</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-obsidian-900">Create an account</h1>
                        <p className="text-sm text-obsidian-500 mt-2">Enter your details below to create your account.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>

                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-xs font-medium text-obsidian-700">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="block w-full px-3 py-2.5 bg-white border border-obsidian-200 rounded-sm text-sm shadow-sm placeholder-obsidian-400 focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 transition-all duration-200"
                                placeholder="Grant Smith"
                            />
                        </div>

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

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-xs font-medium text-obsidian-700">Password</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    required
                                    onChange={(e) => calculatePasswordStrength(e.target.value)}
                                    className="block w-full px-3 py-2.5 bg-white border border-obsidian-200 rounded-sm text-sm shadow-sm placeholder-obsidian-400 focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 transition-all duration-200"
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4 text-obsidian-400 hover:text-obsidian-600" /> : <Eye className="h-4 w-4 text-obsidian-400 hover:text-obsidian-600" />}
                                </button>
                            </div>
                            {/* Password Strength Meter */}
                            <div className="flex gap-1 pt-1">
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1 w-full rounded-full ${passwordStrength >= level ? 'bg-gold-400' : 'bg-obsidian-100'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                            <p className="text-[10px] text-obsidian-500">Must be at least 8 characters and include a number.</p>
                        </div>

                        <div className="flex items-start pt-2">
                            <label className="flex items-start gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    required
                                    className="w-4 h-4 mt-0.5 rounded border-obsidian-300 text-obsidian-900 focus:ring-gold-500"
                                />
                                <span className="text-xs text-obsidian-500 leading-snug">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-obsidian-900 underline underline-offset-2 hover:text-obsidian-700">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="text-obsidian-900 underline underline-offset-2 hover:text-obsidian-700">
                                        Privacy Policy
                                    </Link>.
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-obsidian-900 hover:bg-obsidian-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-obsidian-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-obsidian-900 hover:underline underline-offset-2">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="absolute bottom-6 w-full text-center lg:hidden">
                    <p className="text-[10px] text-obsidian-400 tracking-wide">© 2024 FBG INC.</p>
                </div>
            </div>
        </div>
    )
}
