import { requireRole } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const couponCreateSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters").max(50).transform(v => v.toUpperCase()),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().positive("Value must be positive"),
    minOrderAmount: z.number().positive().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().default(true),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
})

export async function GET() {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ success: true, data: coupons })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch coupons" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const body = await request.json()
        const validation = couponCreateSchema.safeParse(body)

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

        const { code, type, value, minOrderAmount, maxUses, isActive, startsAt, expiresAt } = validation.data

        // Check if coupon code already exists
        const existing = await prisma.coupon.findUnique({
            where: { code }
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: "Coupon code already exists" },
                { status: 409 }
            )
        }

        // Create coupon
        const coupon = await prisma.coupon.create({
            data: {
                code,
                type,
                value,
                minOrderAmount: minOrderAmount || null,
                maxUses: maxUses || null,
                isActive,
                startsAt: startsAt ? new Date(startsAt) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            }
        })

        await logActivity(
            session!.user.id,
            "CREATE_COUPON",
            "coupon",
            coupon.id,
            { code: coupon.code, type: coupon.type, value: coupon.value }
        )

        return NextResponse.json({ success: true, data: coupon }, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to create coupon" },
            { status: 500 }
        )
    }
}
