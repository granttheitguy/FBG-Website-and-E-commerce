import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerSegmentSchema } from "@/lib/validation-schemas"
import { logActivity } from "@/lib/logger"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
        if (error) return error

        const { id } = await params
        const body = await req.json()

        const parsed = customerSegmentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const existing = await prisma.customerSegment.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Segment not found" },
                { status: 404 }
            )
        }

        // Check for name conflict with other segments
        const nameConflict = await prisma.customerSegment.findFirst({
            where: {
                name: parsed.data.name,
                NOT: { id },
            },
        })

        if (nameConflict) {
            return NextResponse.json(
                { error: "A segment with this name already exists" },
                { status: 409 }
            )
        }

        const data = parsed.data
        const segment = await prisma.customerSegment.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color,
                isAutomatic: data.isAutomatic,
            },
        })

        await logActivity(
            session!.user.id,
            "UPDATE_SEGMENT",
            "CustomerSegment",
            id,
            { name: data.name }
        )

        return NextResponse.json(segment)
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
        if (error) return error

        const { id } = await params

        const existing = await prisma.customerSegment.findUnique({
            where: { id },
            select: { id: true, name: true },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Segment not found" },
                { status: 404 }
            )
        }

        await prisma.customerSegment.delete({
            where: { id },
        })

        await logActivity(
            session!.user.id,
            "DELETE_SEGMENT",
            "CustomerSegment",
            id,
            { name: existing.name }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
