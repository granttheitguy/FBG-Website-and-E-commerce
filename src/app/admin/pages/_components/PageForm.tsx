"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Save, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPage, updatePage, deletePage } from "../actions"

interface PageData {
    id: string
    slug: string
    title: string
    content: string
    metaTitle: string | null
    metaDescription: string | null
    isPublished: boolean
    createdAt: Date
    updatedAt: Date
}

interface PageFormProps {
    page?: PageData
}

export default function PageForm({ page }: PageFormProps) {
    const router = useRouter()
    const isEditing = !!page

    const [title, setTitle] = useState(page?.title ?? "")
    const [slug, setSlug] = useState(page?.slug ?? "")
    const [content, setContent] = useState(page?.content ?? "")
    const [metaTitle, setMetaTitle] = useState(page?.metaTitle ?? "")
    const [metaDescription, setMetaDescription] = useState(page?.metaDescription ?? "")
    const [isPublished, setIsPublished] = useState(page?.isPublished ?? true)

    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState("")
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)

    const generateSlug = useCallback((value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
    }, [])

    function handleTitleChange(value: string) {
        setTitle(value)
        if (!slugManuallyEdited) {
            setSlug(generateSlug(value))
        }
    }

    function handleSlugChange(value: string) {
        setSlugManuallyEdited(true)
        setSlug(generateSlug(value))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const data = {
            title,
            slug,
            content,
            metaTitle: metaTitle || undefined,
            metaDescription: metaDescription || undefined,
            isPublished,
        }

        try {
            const result = isEditing
                ? await updatePage(page.id, data)
                : await createPage(data)

            if (result.error) {
                setError(result.error)
                setIsLoading(false)
                return
            }

            router.push("/admin/pages")
            router.refresh()
        } catch {
            setError("An unexpected error occurred")
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!page) return
        if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) return

        setIsDeleting(true)
        setError("")

        try {
            const result = await deletePage(page.id)
            if (result.error) {
                setError(result.error)
                setIsDeleting(false)
                return
            }

            router.push("/admin/pages")
            router.refresh()
        } catch {
            setError("An unexpected error occurred")
            setIsDeleting(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl">
            {/* Back Link */}
            <Link
                href="/admin/pages"
                className="inline-flex items-center gap-1 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Pages
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">
                        {isEditing ? "Edit Page" : "Create New Page"}
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        {isEditing
                            ? "Update the page content and settings."
                            : "Add a new content page to your site."}
                    </p>
                </div>
                {isEditing && (
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div
                    className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Main Content Card */}
                <div className="bg-white shadow-sm rounded-sm border border-obsidian-200 p-6 space-y-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                        Page Content
                    </h2>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            name="title"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Page title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            name="slug"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="page-slug"
                            required
                        />
                        <p className="text-xs text-obsidian-400">
                            URL: /{slug || "page-slug"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Content (HTML)</Label>
                        <textarea
                            id="content"
                            name="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={18}
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-sm text-obsidian-900 font-mono placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
                            placeholder="<h2>Section Title</h2><p>Your content here...</p>"
                            required
                        />
                        <p className="text-xs text-obsidian-400">
                            HTML content will be rendered directly on the page. Use h2, h3, p, ul, ol, a, etc.
                        </p>
                    </div>
                </div>

                {/* SEO Card */}
                <div className="bg-white shadow-sm rounded-sm border border-obsidian-200 p-6 space-y-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                        SEO & Metadata
                    </h2>

                    <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                            id="metaTitle"
                            name="metaTitle"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            placeholder="Custom page title for search engines (optional)"
                        />
                        <p className="text-xs text-obsidian-400">
                            Defaults to page title if left empty.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <textarea
                            id="metaDescription"
                            name="metaDescription"
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            rows={3}
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-sm text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
                            placeholder="Brief description for search engine results (optional)"
                        />
                    </div>
                </div>

                {/* Publishing Card */}
                <div className="bg-white shadow-sm rounded-sm border border-obsidian-200 p-6 space-y-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider">
                        Publishing
                    </h2>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isPublished}
                            aria-label="Published status"
                            onClick={() => setIsPublished(!isPublished)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ${
                                isPublished ? "bg-obsidian-900" : "bg-obsidian-200"
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isPublished ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                        <Label className="cursor-pointer" onClick={() => setIsPublished(!isPublished)}>
                            {isPublished ? "Published" : "Draft"}
                        </Label>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isEditing ? "Save Changes" : "Create Page"}
                    </Button>
                    <Link
                        href="/admin/pages"
                        className="text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
