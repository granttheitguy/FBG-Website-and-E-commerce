import { requireRole } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { customerMeasurementSchema } from "@/lib/validation-schemas"
import { logActivity } from "@/lib/logger"

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
        if (error) return error

        const { id } = await params

        const measurements = await prisma.customerMeasurement.findMany({
            where: { userId: id },
            orderBy: { updatedAt: "desc" },
        })

        return NextResponse.json(measurements)
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

        const parsed = customerMeasurementSchema.safeParse(body)
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
        const measurement = await prisma.customerMeasurement.create({
            data: {
                userId: id,
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
            "CREATE_MEASUREMENT",
            "CustomerMeasurement",
            measurement.id,
            { customerId: id, label: data.label }
        )

        return NextResponse.json(measurement, { status: 201 })
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
