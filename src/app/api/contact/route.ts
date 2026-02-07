import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { contactMessageSchema } from "@/lib/validation-schemas"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"
import { createBulkNotification } from "@/lib/notifications"

export async function POST(req: Request) {
    const ip = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(`contact-message:${ip}`, rateLimitConfigs.api)
    const blocked = rateLimitResponse(rateLimitResult)
    if (blocked) return blocked

    try {
        const body = await req.json()

        const result = contactMessageSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const { firstName, lastName, email, message } = result.data

        const contactMessage = await prisma.contactMessage.create({
            data: {
                firstName,
                lastName,
                email,
                message,
                isRead: false,
            },
        })

        // Notify admins about new contact message
        const admins = await prisma.user.findMany({
            where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
            select: { id: true }
        })
        const adminIds = admins.map(a => a.id)
        await createBulkNotification(
            adminIds,
            "New Contact Message",
            `New message from ${firstName} ${lastName} (${email})`,
            "SYSTEM",
            "/admin/messages"
        )

        return NextResponse.json(
            { message: "Message sent successfully", id: contactMessage.id },
            { status: 201 }
        )
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
