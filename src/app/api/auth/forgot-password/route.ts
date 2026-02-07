import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.auth)
    const limitResponse = rateLimitResponse(rateLimitResult)
    if (limitResponse) return limitResponse

    try {
        const { email } = await req.json()

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ message: "If an account exists, email sent." })
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 3600000) // 1 hour

        // Save token
        await prisma.passwordReset.create({
            data: {
                email,
                token,
                expiresAt
            }
        })

        // Send Email (gracefully handle SMTP not configured)
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

        try {
            await sendEmail(
                email,
                "Reset Your Password - Fashion By Grant",
                `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`,
                `Reset your password here: ${resetLink}`
            )
        } catch (error) {
            // Continue - don't reveal if email was actually sent
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({ message: "If an account exists, a reset link has been sent" })
    } catch (error) {

        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
