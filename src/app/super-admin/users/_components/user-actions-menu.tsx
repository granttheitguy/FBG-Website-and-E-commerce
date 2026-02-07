'use client'

import { useState } from "react"
import { MoreHorizontal, Pencil, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserFormDialog } from "./user-form-dialog"
import { toggleUserStatus } from "../actions"

type UserActionsMenuProps = {
    user: {
        id: string
        name: string
        email: string
        role: string
        status: 'ACTIVE' | 'SUSPENDED'
    }
}

export function UserActionsMenu({ user }: UserActionsMenuProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusToggle = async () => {
        setIsLoading(true)
        try {
            const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
            await toggleUserStatus(user.id, newStatus)
        } catch (error) {
            console.error("Failed to toggle status:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleStatusToggle}
                        className={user.status === 'ACTIVE' ? "text-red-600" : "text-green-600"}
                        disabled={isLoading}
                    >
                        {user.status === 'ACTIVE' ? (
                            <>
                                <Ban className="mr-2 h-4 w-4" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <UserFormDialog
                mode="edit"
                user={user}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />
        </>
    )
}
