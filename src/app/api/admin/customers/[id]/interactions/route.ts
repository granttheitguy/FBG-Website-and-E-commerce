import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerInteractionSchema } from "@/lib/validation-schemas"
import { logActivity } from "@/lib/logger"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id } = await params
        const { searchParams } = new URL(req.url)
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10))
        const offset = parseInt(searchParams.get("offset") || "0", 10)

        const interactions = await prisma.customerInteraction.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            select: {
                id: true,
                type: true,
                subject: true,
                description: true,
                metadata: true,
                createdAt: true,
                staff: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        const total = await prisma.customerInteraction.count({
            where: { userId: id },
        })

        return NextResponse.json({ interactions, total })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id } = await params
        const body = await req.json()

        // Override userId from route param for safety
        const parsed = customerInteractionSchema.safeParse({
            ...body,
            userId: id,
        })

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        // Verify customer exists
        const customer = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        })

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            )
        }

        const data = parsed.data
        const interaction = await prisma.customerInteraction.create({
            data: {
                userId: id,
                staffUserId: session!.user.id,
                type: data.type,
                subject: data.subject || null,
                description: data.description,
            },
            include: {
                staff: {
                    select: { id: true, name: true },
                },
            },
        })

        await logActivity(
            session!.user.id,
            "LOG_INTERACTION",
            "CustomerInteraction",
            interaction.id,
            { customerId: id, type: data.type }
        )

        return NextResponse.json(interaction, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
