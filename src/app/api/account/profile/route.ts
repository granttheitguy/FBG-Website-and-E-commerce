import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { profileUpdateSchema } from "@/lib/validation-schemas"
import { requireAuth } from "@/lib/rbac"

export async function PATCH(req: Request) {
    // Check authorization
    const { error, session } = await requireAuth()
    if (error) return error

    try {
        const body = await req.json()

        // Validate input
        const validatedData = profileUpdateSchema.parse(body)
        const { name, phone, address } = validatedData

        // Update User and Profile
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                profile: {
                    upsert: {
                        create: {
                            phone,
                            defaultShippingAddress: address ? JSON.stringify(address) : undefined
                        },
                        update: {
                            phone,
                            defaultShippingAddress: address ? JSON.stringify(address) : undefined
                        }
                    }
                }
            }
        })

        return NextResponse.json(updatedUser)
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
