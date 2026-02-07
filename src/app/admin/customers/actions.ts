"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import {
    customerMeasurementSchema,
    customerInteractionSchema,
    customerSegmentSchema,
    customerTagSchema,
} from "@/lib/validation-schemas"

// ----- Measurements -----

export async function createMeasurement(customerId: string, formData: Record<string, unknown>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerMeasurementSchema.safeParse(formData)
    if (!parsed.success) {
        return { error: "Validation failed", details: parsed.error.flatten() }
    }

    try {
        const data = parsed.data
        const measurement = await prisma.customerMeasurement.create({
            data: {
                userId: customerId,
                label: data.label,
                chest: data.chest || null,
                shoulder: data.shoulder || null,
                sleeveLength: data.sleeveLength || null,
                neck: data.neck || null,
                backLength: data.backLength || null,
                waist: data.waist || null,
                hip: data.hip || null,
                inseam: data.inseam || null,
                outseam: data.outseam || null,
                thigh: data.thigh || null,
                height: data.height || null,
                weight: data.weight || null,
                notes: data.notes || null,
                measuredBy: data.measuredBy || null,
                measuredAt: data.measuredAt ? new Date(data.measuredAt) : null,
            },
        })

        await logActivity(session.user.id, "CREATE_MEASUREMENT", "CustomerMeasurement", measurement.id)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true, measurement }
    } catch (err) {
        console.error("Create measurement error:", err)
        return { error: "Failed to create measurement" }
    }
}

export async function updateMeasurement(
    customerId: string,
    measurementId: string,
    formData: Record<string, unknown>
) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerMeasurementSchema.safeParse(formData)
    if (!parsed.success) {
        return { error: "Validation failed", details: parsed.error.flatten() }
    }

    try {
        const existing = await prisma.customerMeasurement.findFirst({
            where: { id: measurementId, userId: customerId },
        })
        if (!existing) {
            return { error: "Measurement not found" }
        }

        const data = parsed.data
        const measurement = await prisma.customerMeasurement.update({
            where: { id: measurementId },
            data: {
                label: data.label,
                chest: data.chest || null,
                shoulder: data.shoulder || null,
                sleeveLength: data.sleeveLength || null,
                neck: data.neck || null,
                backLength: data.backLength || null,
                waist: data.waist || null,
                hip: data.hip || null,
                inseam: data.inseam || null,
                outseam: data.outseam || null,
                thigh: data.thigh || null,
                height: data.height || null,
                weight: data.weight || null,
                notes: data.notes || null,
                measuredBy: data.measuredBy || null,
                measuredAt: data.measuredAt ? new Date(data.measuredAt) : null,
            },
        })

        await logActivity(session.user.id, "UPDATE_MEASUREMENT", "CustomerMeasurement", measurementId)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true, measurement }
    } catch (err) {
        console.error("Update measurement error:", err)
        return { error: "Failed to update measurement" }
    }
}

export async function deleteMeasurement(customerId: string, measurementId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const existing = await prisma.customerMeasurement.findFirst({
            where: { id: measurementId, userId: customerId },
        })
        if (!existing) {
            return { error: "Measurement not found" }
        }

        await prisma.customerMeasurement.delete({ where: { id: measurementId } })
        await logActivity(session.user.id, "DELETE_MEASUREMENT", "CustomerMeasurement", measurementId)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true }
    } catch (err) {
        console.error("Delete measurement error:", err)
        return { error: "Failed to delete measurement" }
    }
}

// ----- Interactions -----

export async function createInteraction(customerId: string, formData: Record<string, unknown>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerInteractionSchema.safeParse({
        ...formData,
        userId: customerId,
    })
    if (!parsed.success) {
        return { error: "Validation failed", details: parsed.error.flatten() }
    }

    try {
        const data = parsed.data
        const interaction = await prisma.customerInteraction.create({
            data: {
                userId: customerId,
                staffUserId: session.user.id,
                type: data.type,
                subject: data.subject || null,
                description: data.description,
            },
            include: {
                staff: { select: { id: true, name: true } },
            },
        })

        await logActivity(session.user.id, "LOG_INTERACTION", "CustomerInteraction", interaction.id)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true, interaction }
    } catch (err) {
        console.error("Create interaction error:", err)
        return { error: "Failed to log interaction" }
    }
}

// ----- Tags -----

export async function assignTag(customerId: string, tagId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.customerTagAssignment.upsert({
            where: { userId_tagId: { userId: customerId, tagId } },
            create: { userId: customerId, tagId },
            update: {},
        })

        await logActivity(session.user.id, "ASSIGN_TAG", "CustomerTagAssignment", tagId)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true }
    } catch (err) {
        console.error("Assign tag error:", err)
        return { error: "Failed to assign tag" }
    }
}

export async function removeTag(customerId: string, tagId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.customerTagAssignment.delete({
            where: { userId_tagId: { userId: customerId, tagId } },
        })

        await logActivity(session.user.id, "REMOVE_TAG", "CustomerTagAssignment", tagId)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true }
    } catch (err) {
        console.error("Remove tag error:", err)
        return { error: "Failed to remove tag" }
    }
}

// ----- Segments -----

export async function addToSegment(customerId: string, segmentId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.customerSegmentMember.upsert({
            where: { userId_segmentId: { userId: customerId, segmentId } },
            create: { userId: customerId, segmentId },
            update: {},
        })

        await logActivity(session.user.id, "ADD_TO_SEGMENT", "CustomerSegmentMember", segmentId)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true }
    } catch (err) {
        console.error("Add to segment error:", err)
        return { error: "Failed to add to segment" }
    }
}

export async function removeFromSegment(customerId: string, segmentId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.customerSegmentMember.delete({
            where: { userId_segmentId: { userId: customerId, segmentId } },
        })

        await logActivity(session.user.id, "REMOVE_FROM_SEGMENT", "CustomerSegmentMember", segmentId)
        revalidatePath(`/admin/customers/${customerId}`)
        return { success: true }
    } catch (err) {
        console.error("Remove from segment error:", err)
        return { error: "Failed to remove from segment" }
    }
}

// ----- Segment CRUD -----

export async function createSegment(formData: Record<string, unknown>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerSegmentSchema.safeParse(formData)
    if (!parsed.success) {
        return { error: "Validation failed", details: parsed.error.flatten() }
    }

    try {
        const data = parsed.data
        const segment = await prisma.customerSegment.create({
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color,
                isAutomatic: data.isAutomatic,
            },
        })

        await logActivity(session.user.id, "CREATE_SEGMENT", "CustomerSegment", segment.id)
        revalidatePath("/admin/segments")
        return { success: true, segment }
    } catch (err) {
        console.error("Create segment error:", err)
        return { error: "Failed to create segment" }
    }
}

export async function updateSegment(segmentId: string, formData: Record<string, unknown>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerSegmentSchema.safeParse(formData)
    if (!parsed.success) {
        return { error: "Validation failed", details: parsed.error.flatten() }
    }

    try {
        const data = parsed.data
        const segment = await prisma.customerSegment.update({
            where: { id: segmentId },
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color,
                isAutomatic: data.isAutomatic,
            },
        })

        await logActivity(session.user.id, "UPDATE_SEGMENT", "CustomerSegment", segmentId)
        revalidatePath("/admin/segments")
        return { success: true, segment }
    } catch (err) {
        console.error("Update segment error:", err)
        return { error: "Failed to update segment" }
    }
}

export async function deleteSegment(segmentId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.customerSegment.delete({ where: { id: segmentId } })
        await logActivity(session.user.id, "DELETE_SEGMENT", "CustomerSegment", segmentId)
        revalidatePath("/admin/segments")
        return { success: true }
    } catch (err) {
        console.error("Delete segment error:", err)
        return { error: "Failed to delete segment" }
    }
}

// ----- Tag CRUD -----

export async function createTag(formData: Record<string, unknown>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const parsed = customerTagSchema.safeParse(formData)
    if (!parsed.success) {
        return { error: "Validation failed", details: parsed.error.flatten() }
    }

    try {
        const data = parsed.data
        const tag = await prisma.customerTag.create({
            data: { name: data.name, color: data.color },
        })

        await logActivity(session.user.id, "CREATE_TAG", "CustomerTag", tag.id)
        revalidatePath("/admin/customers")
        return { success: true, tag }
    } catch (err) {
        console.error("Create tag error:", err)
        return { error: "Failed to create tag" }
    }
}
