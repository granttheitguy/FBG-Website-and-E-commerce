import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.auth)
    const limitResponse = rateLimitResponse(rateLimitResult)
    if (limitResponse) return limitResponse

    try {
        const { token, password } = await req.json()

        // Find valid token
        const resetRequest = await prisma.passwordReset.findUnique({
            where: { token }
        })

        if (!resetRequest || resetRequest.expiresAt < new Date()) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
        }

        // Hash new password
        const passwordHash = await hash(password, 12)

        // Update user password
        await prisma.user.update({
            where: { email: resetRequest.email },
            data: { passwordHash }
        })

        // Delete reset token
        await prisma.passwordReset.delete({
            where: { id: resetRequest.id }
        })

        return NextResponse.json({ message: "Password reset successfully" })
    } catch (error) {

        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
