"use client"

import { useState, useTransition } from "react"
import { MoreVertical, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { CouponFormDialog } from "./coupon-form-dialog"
import { deleteCoupon, toggleCouponStatus } from "./actions"
import type { Coupon } from "@prisma/client"

interface CouponActionsProps {
    coupon: Coupon
}

export function CouponActions({ coupon }: CouponActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [editOpen, setEditOpen] = useState(false)

    function handleToggle() {
        if (confirm(`Are you sure you want to ${coupon.isActive ? "deactivate" : "activate"} this coupon?`)) {
            startTransition(async () => {
                await toggleCouponStatus(coupon.id, !coupon.isActive)
            })
        }
    }

    function handleDelete() {
        if (
            confirm(
                `Are you sure you want to delete the coupon "${coupon.code}"? This action cannot be undone.`
            )
        ) {
            startTransition(async () => {
                await deleteCoupon(coupon.id)
            })
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        className="h-8 w-8 p-0"
                    >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggle}>
                        {coupon.isActive ? (
                            <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Activate
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {editOpen && (
                <CouponFormDialog mode="edit" coupon={coupon}>
                    <div />
                </CouponFormDialog>
            )}
        </>
    )
}
