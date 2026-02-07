"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Save, Loader2 } from "lucide-react"

interface TemplateFormProps {
    template?: any
    isNew?: boolean
}

export default function TemplateForm({ template, isNew = false }: TemplateFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            subject: formData.get("subject"),
            bodyHtml: formData.get("bodyHtml"),
            isActive: formData.get("isActive") === "on",
        }

        try {
            const url = isNew
                ? "/api/admin/settings/templates"
                : `/api/admin/settings/templates/${template.id}`

            const method = isNew ? "POST" : "PATCH"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || "Failed to save template")
            }

            router.push("/super-admin/settings/templates")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/super-admin/settings/templates" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-medium text-obsidian-900">{isNew ? "New Template" : "Edit Template"}</h1>
                        <p className="text-sm text-obsidian-500 mt-1">Define the email content and placeholders.</p>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-obsidian-800 transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Template
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm text-sm mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-obsidian-700 mb-1">Template Name (Unique)</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={template?.name || ""}
                            placeholder="WELCOME_EMAIL"
                            required
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border uppercase"
                        />
                        <p className="text-xs text-obsidian-500 mt-1">Used in code to trigger this email.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-obsidian-700 mb-1">Subject Line</label>
                        <input
                            type="text"
                            name="subject"
                            defaultValue={template?.subject || ""}
                            placeholder="Welcome to Fashion by Grant!"
                            required
                            className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-obsidian-700 mb-1">HTML Content</label>
                    <textarea
                        name="bodyHtml"
                        defaultValue={template?.bodyHtml || ""}
                        rows={15}
                        required
                        className="w-full rounded-sm border-obsidian-300 shadow-sm focus:border-obsidian-900 focus:ring-obsidian-900 sm:text-sm py-2.5 px-3 border font-mono"
                    />
                    <p className="text-xs text-obsidian-500 mt-1">
                        Available placeholders: {'{{name}}'}, {'{{email}}'}, {'{{orderNumber}}'}, {'{{total}}'}, {'{{link}}'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        id="isActive"
                        defaultChecked={template?.isActive ?? true}
                        className="rounded border-obsidian-300 text-obsidian-900 focus:ring-obsidian-900"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-obsidian-700">Active</label>
                </div>
            </div>
        </form>
    )
}
