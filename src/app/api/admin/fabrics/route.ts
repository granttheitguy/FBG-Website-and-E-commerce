import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { fabricInventorySchema } from "@/lib/validation-schemas"

export async function GET(req: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")
        const lowStock = searchParams.get("lowStock") === "true"
        const supplierId = searchParams.get("supplierId")
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { type: { contains: search, mode: "insensitive" } },
                { color: { contains: search, mode: "insensitive" } },
            ]
        }

        if (supplierId) {
            where.supplierId = supplierId
        }

        const [fabrics, total] = await Promise.all([
            prisma.fabricInventory.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                include: {
                    supplier: { select: { id: true, name: true } },
                },
            }),
            prisma.fabricInventory.count({ where }),
        ])

        // Filter low stock in application layer since Prisma doesn't support
        // comparing two columns directly in where clause
        let filtered = fabrics.map((f) => ({
            ...f,
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
        }))

        if (lowStock) {
            filtered = filtered.filter((f) => f.quantityYards <= f.minStockLevel)
        }

        const lowStockCount = fabrics.filter(
            (f) => f.quantityYards <= f.minStockLevel
        ).length

        return NextResponse.json({
            fabrics: filtered,
            total: lowStock ? filtered.length : total,
            page,
            totalPages: Math.ceil((lowStock ? filtered.length : total) / limit),
            lowStockCount,
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

        const result = fabricInventorySchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const data = result.data

        const fabric = await prisma.fabricInventory.create({
            data: {
                name: data.name,
                type: data.type,
                color: data.color || null,
                pattern: data.pattern || null,
                quantityYards: data.quantityYards,
                minStockLevel: data.minStockLevel,
                costPerYard: data.costPerYard ?? null,
                supplierId: data.supplierId || null,
                location: data.location || null,
                notes: data.notes || null,
            },
            include: {
                supplier: { select: { id: true, name: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "CREATE_FABRIC",
            "FABRIC",
            fabric.id,
            { name: fabric.name, type: fabric.type }
        )

        return NextResponse.json(
            {
                ...fabric,
                createdAt: fabric.createdAt.toISOString(),
                updatedAt: fabric.updatedAt.toISOString(),
            },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
