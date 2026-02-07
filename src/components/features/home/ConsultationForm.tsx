"use client"

import { useState, FormEvent } from "react"

export default function ConsultationForm() {
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [type, setType] = useState("measurement")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            const response = await fetch("/api/consultations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    phone,
                    type,
                    message: message || undefined,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit consultation request")
            }

            setSuccess(true)
            // Reset form
            setName("")
            setPhone("")
            setType("measurement")
            setMessage("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white/5 p-8 rounded-sm border border-white/10">
            <h3 className="text-xl font-medium mb-4">Book a Consultation</h3>

            {success && (
                <div className="mb-4 p-4 bg-gold-500/20 border border-gold-500/50 rounded-sm text-gold-100 text-sm">
                    Thank you! We&apos;ve received your consultation request and will contact you shortly.
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-sm text-red-100 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full bg-obsidian-800 border-none rounded-sm py-3 px-4 text-white placeholder-obsidian-500 focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                    />
                    <input
                        type="tel"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full bg-obsidian-800 border-none rounded-sm py-3 px-4 text-white placeholder-obsidian-500 focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                    />
                </div>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={loading}
                    className="w-full bg-obsidian-800 border-none rounded-sm py-3 px-4 text-white focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                >
                    <option value="measurement">Measurement / Fitting</option>
                    <option value="wedding">Wedding Consultation</option>
                    <option value="fabric">Fabric Selection</option>
                    <option value="pickup">Pick up</option>
                </select>
                <textarea
                    placeholder="Message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    disabled={loading}
                    className="w-full bg-obsidian-800 border-none rounded-sm py-3 px-4 text-white placeholder-obsidian-500 focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold-500 text-white font-medium py-3.5 rounded-sm hover:bg-gold-600 transition-colors text-sm tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Submitting..." : "Request Appointment"}
                </button>
            </form>
        </div>
    )
}
