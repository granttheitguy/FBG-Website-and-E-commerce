import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER"

export async function requireAuth() {
    const session = await auth()

    if (!session?.user) {
        return {
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
            session: null
        }
    }

    return { error: null, session }
}

export async function requireRole(allowedRoles: UserRole[]) {
    const { error, session } = await requireAuth()

    if (error) return { error, session: null }

    if (!allowedRoles.includes(session!.user.role as UserRole)) {
        return {
            error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
            session: null
        }
    }

    return { error: null, session }
}

export async function requireOwnership(resourceUserId: string) {
    const { error, session } = await requireAuth()

    if (error) return { error, session: null }

    // Admins and Super Admins can access any resource
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session!.user.role)

    if (!isAdmin && session!.user.id !== resourceUserId) {
        return {
            error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
            session: null
        }
    }

    return { error: null, session }
}

export function isAdmin(role: string): boolean {
    return ["ADMIN", "SUPER_ADMIN"].includes(role)
}

export function isStaff(role: string): boolean {
    return ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role)
}
