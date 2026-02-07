import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, email, role, status, password } = body

        if (role && session.user.role !== "SUPER_ADMIN" && (role === "ADMIN" || role === "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Only Super Admins can assign Admin or Super Admin roles" }, { status: 403 })
        }

        const updateData: any = { name, email, role, status }

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10)
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        })

        const { passwordHash, ...userWithoutPassword } = updatedUser
        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Prevent deleting yourself
        if (session.user.id === id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
        }

        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
