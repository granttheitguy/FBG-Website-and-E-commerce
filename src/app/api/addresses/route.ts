import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { addressSchema } from "@/lib/validation-schemas"

export async function GET() {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" }
            ]
        })

        return NextResponse.json(addresses)
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const result = addressSchema.safeParse(body)

        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const data = result.data
        const userId = session.user.id

        // If this address is set as default, unset all other default addresses for this user
        if (data.isDefault) {
            await prisma.address.updateMany({
                where: {
                    userId,
                    isDefault: true
                },
                data: { isDefault: false }
            })
        }

        const address = await prisma.address.create({
            data: {
                ...data,
                userId
            }
        })

        return NextResponse.json(address, { status: 201 })
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
