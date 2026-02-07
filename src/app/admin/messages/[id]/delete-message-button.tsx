"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteMessage } from "../actions"

interface DeleteMessageButtonProps {
    messageId: string
}

export function DeleteMessageButton({ messageId }: DeleteMessageButtonProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function handleDelete() {
        if (!confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
            return
        }

        startTransition(async () => {
            const result = await deleteMessage(messageId)
            if (result.error) {
                alert(result.error)
                return
            }
            router.push("/admin/messages")
        })
    }

    return (
        <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={isPending}
        >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
        </Button>
    )
}
