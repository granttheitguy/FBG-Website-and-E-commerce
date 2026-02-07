import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { consultationBookingSchema } from "@/lib/validation-schemas"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"
import { createBulkNotification } from "@/lib/notifications"

export async function POST(req: Request) {
    const ip = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(`consultation-booking:${ip}`, rateLimitConfigs.api)
    const blocked = rateLimitResponse(rateLimitResult)
    if (blocked) return blocked

    try {
        const body = await req.json()

        const result = consultationBookingSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const { name, phone, email, type, message, preferredDate } = result.data

        const booking = await prisma.consultationBooking.create({
            data: {
                name,
                phone,
                email: email || null,
                type,
                message: message || null,
                status: "PENDING",
                preferredDate: preferredDate ? new Date(preferredDate) : null,
            },
        })

        // Notify admins about new consultation request
        const admins = await prisma.user.findMany({
            where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
            select: { id: true }
        })
        await createBulkNotification(
            admins.map(a => a.id),
            "New Consultation Request",
            `New consultation request from ${name} - ${type}`,
            "SYSTEM",
            "/admin/consultations"
        )

        return NextResponse.json(
            { message: "Consultation booking submitted successfully", id: booking.id },
            { status: 201 }
        )
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
