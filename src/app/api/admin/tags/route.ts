import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerTagSchema } from "@/lib/validation-schemas"
import { logActivity } from "@/lib/logger"

export async function GET() {
    try {
        const { error } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const tags = await prisma.customerTag.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { assignments: true },
                },
            },
        })

        const formatted = tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            customerCount: tag._count.assignments,
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
        const parsed = customerTagSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const data = parsed.data

        const existing = await prisma.customerTag.findUnique({
            where: { name: data.name },
        })

        if (existing) {
            return NextResponse.json(
                { error: "A tag with this name already exists" },
                { status: 409 }
            )
        }

        const tag = await prisma.customerTag.create({
            data: {
                name: data.name,
                color: data.color,
            },
        })

        await logActivity(
            session!.user.id,
            "CREATE_TAG",
            "CustomerTag",
            tag.id,
            { name: data.name }
        )

        return NextResponse.json(tag, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
