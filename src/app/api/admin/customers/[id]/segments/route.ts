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
        const { segmentId } = await req.json()

        if (!segmentId) {
            return NextResponse.json(
                { error: "segmentId is required" },
                { status: 400 }
            )
        }

        const [customer, segment] = await Promise.all([
            prisma.user.findUnique({ where: { id }, select: { id: true } }),
            prisma.customerSegment.findUnique({
                where: { id: segmentId },
                select: { id: true, name: true },
            }),
        ])

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }
        if (!segment) {
            return NextResponse.json({ error: "Segment not found" }, { status: 404 })
        }

        const membership = await prisma.customerSegmentMember.upsert({
            where: {
                userId_segmentId: { userId: id, segmentId },
            },
            create: { userId: id, segmentId },
            update: {},
            include: {
                segment: { select: { id: true, name: true, color: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "ADD_TO_SEGMENT",
            "CustomerSegmentMember",
            membership.id,
            { customerId: id, segmentName: segment.name }
        )

        return NextResponse.json(membership, { status: 201 })
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
        const { segmentId } = await req.json()

        if (!segmentId) {
            return NextResponse.json(
                { error: "segmentId is required" },
                { status: 400 }
            )
        }

        const existing = await prisma.customerSegmentMember.findUnique({
            where: {
                userId_segmentId: { userId: id, segmentId },
            },
            include: {
                segment: { select: { name: true } },
            },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Segment membership not found" },
                { status: 404 }
            )
        }

        await prisma.customerSegmentMember.delete({
            where: {
                userId_segmentId: { userId: id, segmentId },
            },
        })

        await logActivity(
            session!.user.id,
            "REMOVE_FROM_SEGMENT",
            "CustomerSegmentMember",
            existing.id,
            { customerId: id, segmentName: existing.segment.name }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
