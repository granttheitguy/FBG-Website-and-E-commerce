import { requireAuth } from "@/lib/rbac"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const { error, session } = await requireAuth()
        if (error) return error

        if (!productId) {
            return NextResponse.json(
                { error: "productId is required" },
                { status: 400 }
            )
        }

        await prisma.wishlistItem.deleteMany({
            where: {
                userId: session!.user.id,
                productId,
            },
        })

        return NextResponse.json({ success: true })
    } catch (err) {

        return NextResponse.json(
            { error: "Failed to remove from wishlist" },
            { status: 500 }
        )
    }
}
