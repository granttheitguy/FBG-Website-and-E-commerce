import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { fabricInventorySchema } from "@/lib/validation-schemas"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params

        const fabric = await prisma.fabricInventory.findUnique({
            where: { id },
            include: {
                supplier: { select: { id: true, name: true } },
            },
        })

        if (!fabric) {
            return NextResponse.json({ error: "Fabric not found" }, { status: 404 })
        }

        return NextResponse.json({
            ...fabric,
            createdAt: fabric.createdAt.toISOString(),
            updatedAt: fabric.updatedAt.toISOString(),
        })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params
        const body = await req.json()

        const result = fabricInventorySchema.partial().safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const existing = await prisma.fabricInventory.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: "Fabric not found" }, { status: 404 })
        }

        const data = result.data
        const updateData: Record<string, unknown> = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.type !== undefined) updateData.type = data.type
        if (data.color !== undefined) updateData.color = data.color || null
        if (data.pattern !== undefined) updateData.pattern = data.pattern || null
        if (data.quantityYards !== undefined) updateData.quantityYards = data.quantityYards
        if (data.minStockLevel !== undefined) updateData.minStockLevel = data.minStockLevel
        if (data.costPerYard !== undefined) updateData.costPerYard = data.costPerYard ?? null
        if (data.supplierId !== undefined) updateData.supplierId = data.supplierId || null
        if (data.location !== undefined) updateData.location = data.location || null
        if (data.notes !== undefined) updateData.notes = data.notes || null
        if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable)

        const updated = await prisma.fabricInventory.update({
            where: { id },
            data: updateData,
            include: {
                supplier: { select: { id: true, name: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "UPDATE_FABRIC",
            "FABRIC",
            id,
            { name: updated.name }
        )

        return NextResponse.json({
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const { id } = await params

        const fabric = await prisma.fabricInventory.findUnique({ where: { id } })
        if (!fabric) {
            return NextResponse.json({ error: "Fabric not found" }, { status: 404 })
        }

        await prisma.fabricInventory.delete({ where: { id } })

        await logActivity(
            session!.user.id,
            "DELETE_FABRIC",
            "FABRIC",
            id,
            { name: fabric.name }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
