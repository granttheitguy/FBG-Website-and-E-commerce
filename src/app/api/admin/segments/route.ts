import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerSegmentSchema } from "@/lib/validation-schemas"
import { logActivity } from "@/lib/logger"

export async function GET() {
    try {
        const { error } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const segments = await prisma.customerSegment.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { members: true },
                },
            },
        })

        const formatted = segments.map((segment) => ({
            id: segment.id,
            name: segment.name,
            description: segment.description,
            color: segment.color,
            isAutomatic: segment.isAutomatic,
            memberCount: segment._count.members,
            createdAt: segment.createdAt,
            updatedAt: segment.updatedAt,
        }))

        return NextResponse.json(formatted)
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
        if (error) return error

        const body = await req.json()
        const parsed = customerSegmentSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const data = parsed.data

        // Check for duplicate name
        const existing = await prisma.customerSegment.findUnique({
            where: { name: data.name },
        })

        if (existing) {
            return NextResponse.json(
                { error: "A segment with this name already exists" },
                { status: 409 }
            )
        }

        const segment = await prisma.customerSegment.create({
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color,
                isAutomatic: data.isAutomatic,
            },
        })

        await logActivity(
            session!.user.id,
            "CREATE_SEGMENT",
            "CustomerSegment",
            segment.id,
            { name: data.name }
        )

        return NextResponse.json(segment, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
