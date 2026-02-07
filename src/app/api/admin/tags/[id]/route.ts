import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerTagSchema } from "@/lib/validation-schemas"
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

        const parsed = customerTagSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const existing = await prisma.customerTag.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Tag not found" },
                { status: 404 }
            )
        }

        // Check for name conflict
        const nameConflict = await prisma.customerTag.findFirst({
            where: {
                name: parsed.data.name,
                NOT: { id },
            },
        })

        if (nameConflict) {
            return NextResponse.json(
                { error: "A tag with this name already exists" },
                { status: 409 }
            )
        }

        const data = parsed.data
        const tag = await prisma.customerTag.update({
            where: { id },
            data: {
                name: data.name,
                color: data.color,
            },
        })

        await logActivity(
            session!.user.id,
            "UPDATE_TAG",
            "CustomerTag",
            id,
            { name: data.name }
        )

        return NextResponse.json(tag)
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

        const existing = await prisma.customerTag.findUnique({
            where: { id },
            select: { id: true, name: true },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Tag not found" },
                { status: 404 }
            )
        }

        await prisma.customerTag.delete({
            where: { id },
        })

        await logActivity(
            session!.user.id,
            "DELETE_TAG",
            "CustomerTag",
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
