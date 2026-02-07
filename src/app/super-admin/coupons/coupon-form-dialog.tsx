"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCoupon, updateCoupon } from "./actions"
import { Loader2 } from "lucide-react"
import type { Coupon } from "@prisma/client"

interface CouponFormDialogProps {
    mode: "create" | "edit"
    coupon?: Coupon
    children: React.ReactNode
}

export function CouponFormDialog({ mode, coupon, children }: CouponFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result =
                mode === "create" ? await createCoupon(formData) : await updateCoupon(formData)

            if (result.error) {
                setError(result.error)
            } else {
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create New Coupon" : "Edit Coupon"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "edit" && <input type="hidden" name="id" value={coupon?.id} />}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input
                                id="code"
                                name="code"
                                defaultValue={coupon?.code}
                                required
                                placeholder="SUMMER2026"
                                className="uppercase"
                            />
                        </div>

                        <div>
                            <Label htmlFor="type">Discount Type</Label>
                            <select
                                id="type"
                                name="type"
                                defaultValue={coupon?.type ?? "PERCENTAGE"}
                                className="w-full px-3 py-2 border border-obsidian-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                            >
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED_AMOUNT">Fixed Amount</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="value">Discount Value</Label>
                            <Input
                                id="value"
                                name="value"
                                type="number"
                                step="0.01"
                                defaultValue={coupon?.value}
                                required
                                placeholder="10"
                            />
                        </div>

                        <div>
                            <Label htmlFor="minOrderAmount">Min. Order Amount (optional)</Label>
                            <Input
                                id="minOrderAmount"
                                name="minOrderAmount"
                                type="number"
                                step="0.01"
                                defaultValue={coupon?.minOrderAmount ?? ""}
                                placeholder="5000"
                            />
                        </div>

                        <div>
                            <Label htmlFor="maxUses">Max Uses (optional)</Label>
                            <Input
                                id="maxUses"
                                name="maxUses"
                                type="number"
                                defaultValue={coupon?.maxUses ?? ""}
                                placeholder="100"
                            />
                        </div>

                        <div className="col-span-2">
                            <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
                            <Input
                                id="expiresAt"
                                name="expiresAt"
                                type="date"
                                defaultValue={
                                    coupon?.expiresAt
                                        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
                                        : ""
                                }
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    defaultChecked={coupon?.isActive ?? true}
                                    className="w-4 h-4 rounded border-obsidian-300 text-blue-600 focus:ring-2 focus:ring-gold-500"
                                />
                                <span className="text-sm font-medium text-obsidian-700">
                                    Active (coupon can be used)
                                </span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 justify-end pt-4 border-t border-obsidian-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {mode === "create" ? "Create Coupon" : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
