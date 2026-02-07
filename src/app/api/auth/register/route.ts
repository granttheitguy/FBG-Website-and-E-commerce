import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"
import { registerSchema } from "@/lib/validation-schemas"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimitResult = await rateLimit(identifier, rateLimitConfigs.auth)
    const limitResponse = rateLimitResponse(rateLimitResult)
    if (limitResponse) return limitResponse

    try {
        const body = await req.json()

        // Validate input
        const validatedData = registerSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            )
        }

        // Hash password
        const passwordHash = await hash(validatedData.password, 12)

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex")

        // Create user with CUSTOMER role (never allow role to be set from form)
        const user = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                passwordHash,
                role: "CUSTOMER", // Always CUSTOMER for public signup
                status: "ACTIVE",
                verificationToken,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        })

        // Create customer profile
        await prisma.customerProfile.create({
            data: {
                userId: user.id,
            }
        })

        // Send Verification Email
        const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`

        try {
            await sendEmail(
                validatedData.email,
                "Verify your email - Fashion by Grant",
                `<h1>Welcome, ${validatedData.name}!</h1><p>Please verify your email address by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
                `Welcome, ${validatedData.name}! Please verify your email here: ${verifyLink}`
            )
        } catch (error) {
            // Continue execution
        }

        return NextResponse.json(
            {
                message: "Account created successfully",
                user
            },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            const zodError = error as any
            return NextResponse.json(
                { error: zodError.errors?.[0]?.message || "Validation error" },
                { status: 400 }
            )
        }


        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}
