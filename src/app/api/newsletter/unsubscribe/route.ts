import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

const unsubscribeSchema = z.object({
    email: z.string().email("Invalid email address"),
})

export async function POST(req: Request) {
    const ip = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(`newsletter-unsubscribe:${ip}`, rateLimitConfigs.api)
    const blocked = rateLimitResponse(rateLimitResult)
    if (blocked) return blocked

    try {
        const body = await req.json()

        const result = unsubscribeSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const { email } = result.data

        const subscriber = await prisma.newsletterSubscriber.findUnique({
            where: { email },
        })

        if (!subscriber) {
            return NextResponse.json(
                { error: "Email not found in our mailing list" },
                { status: 404 }
            )
        }

        await prisma.newsletterSubscriber.update({
            where: { email },
            data: {
                isSubscribed: false,
                unsubscribedAt: new Date(),
            },
        })

        return NextResponse.json({ message: "Successfully unsubscribed from newsletter" })
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
