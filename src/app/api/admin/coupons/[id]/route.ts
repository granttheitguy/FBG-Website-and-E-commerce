import { requireRole } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const couponUpdateSchema = z.object({
    code: z.string().min(3).max(50).transform(v => v.toUpperCase()).optional(),
    type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    value: z.number().positive().optional(),
    minOrderAmount: z.number().positive().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const coupon = await prisma.coupon.findUnique({
            where: { id }
        })

        if (!coupon) {
            return NextResponse.json(
                { success: false, error: "Coupon not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: coupon })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch coupon" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const body = await request.json()
        const validation = couponUpdateSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    errors: validation.error.issues.map((e: any) => ({
                        field: e.path.join("."),
                        message: e.message
                    }))
                },
                { status: 400 }
            )
        }

        const data = validation.data

        // Check if coupon exists
        const existing = await prisma.coupon.findUnique({
            where: { id }
        })

        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Coupon not found" },
                { status: 404 }
            )
        }

        // If updating code, check for duplicates
        if (data.code && data.code !== existing.code) {
            const duplicate = await prisma.coupon.findUnique({
                where: { code: data.code }
            })

            if (duplicate) {
                return NextResponse.json(
                    { success: false, error: "Coupon code already exists" },
                    { status: 409 }
                )
            }
        }

        // Update coupon
        const updateData: any = {}
        if (data.code !== undefined) updateData.code = data.code
        if (data.type !== undefined) updateData.type = data.type
        if (data.value !== undefined) updateData.value = data.value
        if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount
        if (data.maxUses !== undefined) updateData.maxUses = data.maxUses
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null
        if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

        const coupon = await prisma.coupon.update({
            where: { id },
            data: updateData
        })

        await logActivity(
            session!.user.id,
            "UPDATE_COUPON",
            "coupon",
            coupon.id,
            { updates: Object.keys(updateData) }
        )

        return NextResponse.json({ success: true, data: coupon })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to update coupon" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const coupon = await prisma.coupon.findUnique({
            where: { id }
        })

        if (!coupon) {
            return NextResponse.json(
                { success: false, error: "Coupon not found" },
                { status: 404 }
            )
        }

        // Prevent deletion if coupon has been used
        if (coupon.usedCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cannot delete coupon that has been used. Consider deactivating it instead."
                },
                { status: 400 }
            )
        }

        await prisma.coupon.delete({
            where: { id }
        })

        await logActivity(
            session!.user.id,
            "DELETE_COUPON",
            "coupon",
            id,
            { code: coupon.code }
        )

        return NextResponse.json({ success: true, message: "Coupon deleted successfully" })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to delete coupon" },
            { status: 500 }
        )
    }
}
