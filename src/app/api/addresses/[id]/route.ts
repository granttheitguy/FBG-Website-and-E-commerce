import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { addressSchema } from "@/lib/validation-schemas"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        // Check if address exists and belongs to user
        const existingAddress = await prisma.address.findUnique({
            where: { id }
        })

        if (!existingAddress) {
            return NextResponse.json(
                { error: "Address not found" },
                { status: 404 }
            )
        }

        if (existingAddress.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You can only update your own addresses" },
                { status: 403 }
            )
        }

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

        // If setting this as default, unset all other defaults for this user
        if (data.isDefault) {
            await prisma.address.updateMany({
                where: {
                    userId: session.user.id,
                    isDefault: true,
                    NOT: { id }
                },
                data: { isDefault: false }
            })
        }

        const updatedAddress = await prisma.address.update({
            where: { id },
            data
        })

        return NextResponse.json(updatedAddress)
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        // Check if address exists and belongs to user
        const existingAddress = await prisma.address.findUnique({
            where: { id }
        })

        if (!existingAddress) {
            return NextResponse.json(
                { error: "Address not found" },
                { status: 404 }
            )
        }

        if (existingAddress.userId !== session.user.id) {
            return NextResponse.json(
                { error: "You can only delete your own addresses" },
                { status: 403 }
            )
        }

        await prisma.address.delete({
            where: { id }
        })

        return NextResponse.json(
            { message: "Address deleted successfully" },
            { status: 200 }
        )
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
