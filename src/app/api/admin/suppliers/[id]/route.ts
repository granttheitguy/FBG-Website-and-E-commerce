import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { supplierSchema } from "@/lib/validation-schemas"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params

        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                fabrics: {
                    orderBy: { name: "asc" },
                    include: {
                        supplier: { select: { id: true, name: true } },
                    },
                },
                _count: { select: { fabrics: true } },
            },
        })

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
        }

        return NextResponse.json({
            ...supplier,
            createdAt: supplier.createdAt.toISOString(),
            updatedAt: supplier.updatedAt.toISOString(),
            fabrics: supplier.fabrics.map((f) => ({
                ...f,
                createdAt: f.createdAt.toISOString(),
                updatedAt: f.updatedAt.toISOString(),
            })),
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

        const result = supplierSchema.partial().safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const existing = await prisma.supplier.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
        }

        const data = result.data
        const updateData: Record<string, unknown> = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.contactName !== undefined) updateData.contactName = data.contactName || null
        if (data.email !== undefined) updateData.email = data.email || null
        if (data.phone !== undefined) updateData.phone = data.phone || null
        if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null
        if (data.address !== undefined) updateData.address = data.address || null
        if (data.city !== undefined) updateData.city = data.city || null
        if (data.state !== undefined) updateData.state = data.state || null
        if (data.notes !== undefined) updateData.notes = data.notes || null
        if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)

        const updated = await prisma.supplier.update({
            where: { id },
            data: updateData,
            include: {
                _count: { select: { fabrics: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "UPDATE_SUPPLIER",
            "SUPPLIER",
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

        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: { _count: { select: { fabrics: true } } },
        })

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
        }

        // Prevent deletion if supplier has fabrics assigned
        if (supplier._count.fabrics > 0) {
            return NextResponse.json(
                { error: "Cannot delete supplier with assigned fabrics. Remove fabric associations first." },
                { status: 400 }
            )
        }

        await prisma.supplier.delete({ where: { id } })

        await logActivity(
            session!.user.id,
            "DELETE_SUPPLIER",
            "SUPPLIER",
            id,
            { name: supplier.name }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
