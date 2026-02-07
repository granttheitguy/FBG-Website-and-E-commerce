"use client"

import { useState } from "react"
import { Save, Mail, Loader2 } from "lucide-react"

interface SmtpSettingsFormProps {
    settings: any
}

export default function SmtpSettingsForm({ settings }: SmtpSettingsFormProps) {
    const [isTesting, setIsTesting] = useState(false)

    async function handleTestEmail() {
        const email = prompt("Enter email address to send test to:")
        if (!email) return

        setIsTesting(true)
        try {
            const response = await fetch("/api/admin/settings/smtp/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            alert("Test email sent successfully!")
        } catch (error: any) {
            alert("Failed to send test email: " + error.message)
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <form action="/api/admin/settings/smtp" method="POST" className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">Host</label>
                    <input
                        type="text"
                        name="host"
                        defaultValue={settings?.host || ""}
                        placeholder="smtp.example.com"
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">Port</label>
                    <input
                        type="number"
                        name="port"
                        defaultValue={settings?.port || 587}
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">Encryption</label>
                    <select
                        name="encryption"
                        defaultValue={settings?.encryption || "tls"}
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    >
                        <option value="none">None</option>
                        <option value="ssl">SSL</option>
                        <option value="tls">TLS</option>
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">Username</label>
                    <input
                        type="text"
                        name="username"
                        defaultValue={settings?.username || ""}
                        autoComplete="off"
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder={settings?.passwordEncrypted ? "•••••••• (Leave blank to keep unchanged)" : ""}
                        autoComplete="new-password"
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>
            </div>

            <div className="border-t border-obsidian-100 pt-6 grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">From Name</label>
                    <input
                        type="text"
                        name="fromName"
                        defaultValue={settings?.fromName || "FBG Support"}
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">From Email</label>
                    <input
                        type="email"
                        name="fromEmail"
                        defaultValue={settings?.fromEmail || ""}
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                    />
                </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTesting}
                    className="text-sm text-obsidian-500 hover:text-obsidian-900 flex items-center gap-2 disabled:opacity-50"
                >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Send Test Email
                </button>
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-obsidian-800 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save Settings
                </button>
            </div>
        </form>
    )
}
