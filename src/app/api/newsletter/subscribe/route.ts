import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { newsletterSchema } from "@/lib/validation-schemas"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
    const ip = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(`newsletter-subscribe:${ip}`, rateLimitConfigs.api)
    const blocked = rateLimitResponse(rateLimitResult)
    if (blocked) return blocked

    try {
        const body = await req.json()

        const result = newsletterSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const { email, source } = result.data

        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email },
            update: {
                isSubscribed: true,
                source: source || undefined,
                unsubscribedAt: null,
            },
            create: {
                email,
                isSubscribed: true,
                source: source || null,
            },
        })

        return NextResponse.json(
            { message: "Successfully subscribed to newsletter", id: subscriber.id },
            { status: 201 }
        )
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
