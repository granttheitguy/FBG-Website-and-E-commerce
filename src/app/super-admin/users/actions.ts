'use server'

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { createUserSchema, updateUserSchema } from "@/lib/validation-schemas"
import { z } from "zod"

export async function createUser(data: z.infer<typeof createUserSchema>, role: 'ADMIN' | 'STAFF') {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { error: "Unauthorized" }
    }

    const result = createUserSchema.safeParse(data)
    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { name, email, password } = result.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: "User with this email already exists" }
        }

        const passwordHash = await hash(password, 12)

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
                status: "ACTIVE",
            }
        })

        revalidatePath("/super-admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to create user:", error)
        return { error: "Failed to create user" }
    }
}

export async function updateUser(userId: string, data: z.infer<typeof updateUserSchema>) {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { error: "Unauthorized" }
    }

    const result = updateUserSchema.safeParse(data)
    if (!result.success) {
        return { error: "Invalid input" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: result.data
        })

        revalidatePath("/super-admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user:", error)
        return { error: "Failed to update user" }
    }
}

export async function toggleUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { status }
        })

        revalidatePath("/super-admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user status:", error)
        return { error: "Failed to update user status" }
    }
}
