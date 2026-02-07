import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const session = await auth()

        // Only Super Admin and Admin can create users
        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, email, password, role } = body

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (session.user.role !== "SUPER_ADMIN" && (role === "ADMIN" || role === "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Only Super Admins can create Admin or Super Admin users" }, { status: 403 })
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role,
                status: "ACTIVE"
            }
        })

        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
