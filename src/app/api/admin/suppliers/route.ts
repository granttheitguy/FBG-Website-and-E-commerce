import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { supplierSchema } from "@/lib/validation-schemas"

export async function GET(req: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
            ]
        }

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                include: {
                    _count: { select: { fabrics: true } },
                },
            }),
            prisma.supplier.count({ where }),
        ])

        return NextResponse.json({
            suppliers: suppliers.map((s) => ({
                ...s,
                createdAt: s.createdAt.toISOString(),
                updatedAt: s.updatedAt.toISOString(),
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const body = await req.json()

        const result = supplierSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const data = result.data

        const supplier = await prisma.supplier.create({
            data: {
                name: data.name,
                contactName: data.contactName || null,
                email: data.email || null,
                phone: data.phone || null,
                whatsapp: data.whatsapp || null,
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                notes: data.notes || null,
            },
            include: {
                _count: { select: { fabrics: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "CREATE_SUPPLIER",
            "SUPPLIER",
            supplier.id,
            { name: supplier.name }
        )

        return NextResponse.json(
            {
                ...supplier,
                createdAt: supplier.createdAt.toISOString(),
                updatedAt: supplier.updatedAt.toISOString(),
            },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
