"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { supplierSchema } from "@/lib/validation-schemas"

export async function createSupplier(formData: {
    name: string
    contactName?: string
    email?: string
    phone?: string
    whatsapp?: string
    address?: string
    city?: string
    state?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = supplierSchema.safeParse(formData)
    if (!result.success) {
        return { error: "Validation failed", details: result.error.flatten().fieldErrors }
    }

    try {
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
        })

        await logActivity(
            session.user.id,
            "CREATE_SUPPLIER",
            "SUPPLIER",
            supplier.id,
            { name: supplier.name }
        )

        revalidatePath("/admin/suppliers")
        return { success: true, supplierId: supplier.id }
    } catch (err) {
        console.error("Failed to create supplier:", err)
        return { error: "Failed to create supplier" }
    }
}

export async function updateSupplier(
    supplierId: string,
    formData: {
        name?: string
        contactName?: string
        email?: string
        phone?: string
        whatsapp?: string
        address?: string
        city?: string
        state?: string
        notes?: string
        isActive?: boolean
    }
) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = supplierSchema.partial().safeParse(formData)
    if (!result.success) {
        return { error: "Validation failed", details: result.error.flatten().fieldErrors }
    }

    try {
        const existing = await prisma.supplier.findUnique({ where: { id: supplierId } })
        if (!existing) {
            return { error: "Supplier not found" }
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
        if (formData.isActive !== undefined) updateData.isActive = formData.isActive

        await prisma.supplier.update({
            where: { id: supplierId },
            data: updateData,
        })

        await logActivity(
            session.user.id,
            "UPDATE_SUPPLIER",
            "SUPPLIER",
            supplierId,
            { name: existing.name }
        )

        revalidatePath("/admin/suppliers")
        revalidatePath(`/admin/suppliers/${supplierId}`)
        return { success: true }
    } catch (err) {
        console.error("Failed to update supplier:", err)
        return { error: "Failed to update supplier" }
    }
}

export async function deleteSupplier(supplierId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: { _count: { select: { fabrics: true } } },
        })

        if (!supplier) {
            return { error: "Supplier not found" }
        }

        if (supplier._count.fabrics > 0) {
            return { error: "Cannot delete supplier with assigned fabrics. Remove fabric associations first." }
        }

        await prisma.supplier.delete({ where: { id: supplierId } })

        await logActivity(
            session.user.id,
            "DELETE_SUPPLIER",
            "SUPPLIER",
            supplierId,
            { name: supplier.name }
        )

        revalidatePath("/admin/suppliers")
        return { success: true }
    } catch (err) {
        console.error("Failed to delete supplier:", err)
        return { error: "Failed to delete supplier" }
    }
}
