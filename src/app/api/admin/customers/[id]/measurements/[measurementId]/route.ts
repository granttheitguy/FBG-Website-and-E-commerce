import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerMeasurementSchema } from "@/lib/validation-schemas"
import { logActivity } from "@/lib/logger"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; measurementId: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id, measurementId } = await params
        const body = await req.json()

        const parsed = customerMeasurementSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        // Verify measurement belongs to this customer
        const existing = await prisma.customerMeasurement.findFirst({
            where: { id: measurementId, userId: id },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Measurement not found" },
                { status: 404 }
            )
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

        await logActivity(
            session!.user.id,
            "UPDATE_MEASUREMENT",
            "CustomerMeasurement",
            measurementId,
            { customerId: id, label: data.label }
        )

        return NextResponse.json(measurement)
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; measurementId: string }> }
) {
    try {
        const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id, measurementId } = await params

        // Verify measurement belongs to this customer
        const existing = await prisma.customerMeasurement.findFirst({
            where: { id: measurementId, userId: id },
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Measurement not found" },
                { status: 404 }
            )
        }

        await prisma.customerMeasurement.delete({
            where: { id: measurementId },
        })

        await logActivity(
            session!.user.id,
            "DELETE_MEASUREMENT",
            "CustomerMeasurement",
            measurementId,
            { customerId: id, label: existing.label }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
