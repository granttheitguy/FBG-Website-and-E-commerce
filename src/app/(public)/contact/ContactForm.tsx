"use client"

import { useState, useTransition } from "react"
import { Check, AlertCircle } from "lucide-react"

export default function ContactForm() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        startTransition(async () => {
            try {
                const res = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        message,
                    }),
                })

                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to send message")
                }

                setSuccess(true)
                // Reset form
                setFirstName("")
                setLastName("")
                setEmail("")
                setMessage("")

                // Hide success message after 5 seconds
                setTimeout(() => setSuccess(false), 5000)
            } catch (err: any) {
                setError(err.message || "An error occurred. Please try again.")
            }
        })
    }

    return (
        <div className="bg-white rounded-sm border border-obsidian-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-serif text-obsidian-900 mb-6" style={{ letterSpacing: '-0.02em' }}>
                Send a Message
            </h2>

            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-sm p-4 flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-900">Message sent successfully!</p>
                        <p className="text-sm text-green-700 mt-1">
                            We&apos;ll get back to you as soon as possible.
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-900">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-obsidian-700 mb-2">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-[15px]"
                            placeholder="John"
                            required
                            disabled={isPending}
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-obsidian-700 mb-2">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-[15px]"
                            placeholder="Doe"
                            required
                            disabled={isPending}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-obsidian-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors text-[15px]"
                        placeholder="john@example.com"
                        required
                        disabled={isPending}
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-obsidian-700 mb-2">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 rounded-sm border border-obsidian-200 focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900 outline-none transition-colors resize-none text-[15px]"
                        placeholder="How can we help you?"
                        required
                        minLength={10}
                        disabled={isPending}
                    />
                    <p className="mt-1.5 text-xs text-obsidian-500">Minimum 10 characters</p>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-obsidian-900 text-white py-4 rounded-sm font-medium hover:bg-obsidian-800 transition-colors text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                        </span>
                    ) : (
                        "Send Message"
                    )}
                </button>
            </form>
        </div>
    )
}
