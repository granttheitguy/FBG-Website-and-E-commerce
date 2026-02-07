"use client"

import { useState, useEffect, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createCategory, updateCategory } from "../actions"

export interface CategoryData {
    id: string
    name: string
    slug: string
    parentId: string | null
    description: string | null
}

interface CategoryFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: CategoryData | null
    allCategories: CategoryData[]
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export function CategoryFormDialog({
    open,
    onOpenChange,
    category,
    allCategories,
}: CategoryFormDialogProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [parentId, setParentId] = useState("")
    const [description, setDescription] = useState("")
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    const isEditing = !!category

    useEffect(() => {
        if (open) {
            setError(null)
            if (category) {
                setName(category.name)
                setSlug(category.slug)
                setParentId(category.parentId ?? "")
                setDescription(category.description ?? "")
                setSlugManuallyEdited(true)
            } else {
                setName("")
                setSlug("")
                setParentId("")
                setDescription("")
                setSlugManuallyEdited(false)
            }
        }
    }, [open, category])

    function handleNameChange(value: string) {
        setName(value)
        if (!slugManuallyEdited) {
            setSlug(slugify(value))
        }
    }

    function handleSlugChange(value: string) {
        setSlugManuallyEdited(true)
        setSlug(slugify(value))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        const formData = {
            name: name.trim(),
            slug: slug.trim(),
            parentId: parentId || undefined,
            description: description.trim() || undefined,
        }

        startTransition(async () => {
            const result = isEditing
                ? await updateCategory(category!.id, formData)
                : await createCategory(formData)

            if (result.error) {
                setError(result.error)
            } else {
                onOpenChange(false)
            }
        })
    }

    // Filter out current category from parent options to prevent self-parenting
    const parentOptions = allCategories.filter(
        (c) => c.id !== category?.id
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-obsidian-900">
                        {isEditing ? "Edit Category" : "Add Category"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the category details below."
                            : "Create a new product category."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div
                            className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="category-name">Name</Label>
                        <Input
                            id="category-name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Traditional Wear"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category-slug">Slug</Label>
                        <Input
                            id="category-slug"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="e.g. traditional-wear"
                            required
                            pattern="^[a-z0-9-]+$"
                            title="Lowercase letters, numbers, and hyphens only"
                        />
                        <p className="text-xs text-obsidian-400">
                            URL-friendly identifier. Auto-generated from name.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category-parent">Parent Category</Label>
                        <select
                            id="category-parent"
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="flex h-10 w-full rounded-sm border border-obsidian-200 bg-white px-3 py-2 text-sm text-obsidian-900 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900"
                        >
                            <option value="">None (Top Level)</option>
                            {parentOptions.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category-description">Description</Label>
                        <textarea
                            id="category-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description for this category"
                            rows={3}
                            maxLength={500}
                            className="flex w-full rounded-sm border border-obsidian-200 bg-white px-4 py-3 text-[15px] text-obsidian-900 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:border-obsidian-900 focus-visible:ring-1 focus-visible:ring-obsidian-900 resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={isPending}
                        >
                            {isEditing ? "Save Changes" : "Create Category"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
