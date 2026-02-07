"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { deletePage } from "../actions"

interface DeletePageButtonProps {
    pageId: string
    pageTitle: string
}

export default function DeletePageButton({ pageId, pageTitle }: DeletePageButtonProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
            return
        }

        setIsDeleting(true)

        try {
            const result = await deletePage(pageId)
            if (result.error) {
                alert(result.error)
                setIsDeleting(false)
                return
            }

            router.refresh()
        } catch {
            alert("An unexpected error occurred")
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors px-2 py-1 disabled:opacity-50"
            aria-label={`Delete ${pageTitle}`}
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
            <span className="sr-only sm:not-sr-only">Delete</span>
        </button>
    )
}
