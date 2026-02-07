import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.auth)
    const limitResponse = rateLimitResponse(rateLimitResult)
    if (limitResponse) return limitResponse

    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        })

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                verificationToken: null // Clear token
            }
        })

        return NextResponse.json({ message: "Email verified successfully" })
    } catch (error) {

        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
