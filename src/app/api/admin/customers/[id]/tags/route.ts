import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id } = await params
        const { tagId } = await req.json()

        if (!tagId) {
            return NextResponse.json(
                { error: "tagId is required" },
                { status: 400 }
            )
        }

        // Verify customer and tag exist
        const [customer, tag] = await Promise.all([
            prisma.user.findUnique({ where: { id }, select: { id: true } }),
            prisma.customerTag.findUnique({ where: { id: tagId }, select: { id: true, name: true } }),
        ])

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }
        if (!tag) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 })
        }

        // Upsert to avoid duplicate errors
        const assignment = await prisma.customerTagAssignment.upsert({
            where: {
                userId_tagId: { userId: id, tagId },
            },
            create: { userId: id, tagId },
            update: {},
            include: {
                tag: { select: { id: true, name: true, color: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "ASSIGN_TAG",
            "CustomerTagAssignment",
            assignment.id,
            { customerId: id, tagName: tag.name }
        )

        return NextResponse.json(assignment, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id } = await params
        const { tagId } = await req.json()

        if (!tagId) {
            return NextResponse.json(
                { error: "tagId is required" },
                { status: 400 }
            )
        }

        const existing = await prisma.customerTagAssignment.findUnique({
            where: {
                userId_tagId: { userId: id, tagId },
            },
            include: {
                tag: { select: { name: true } },
            },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Tag assignment not found" },
                { status: 404 }
            )
        }

        await prisma.customerTagAssignment.delete({
            where: {
                userId_tagId: { userId: id, tagId },
            },
        })

        await logActivity(
            session!.user.id,
            "REMOVE_TAG",
            "CustomerTagAssignment",
            existing.id,
            { customerId: id, tagName: existing.tag.name }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
