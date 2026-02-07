import { requireAuth } from "@/lib/rbac"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { returnRequestSchema } from "@/lib/validation-schemas"
import { createBulkNotification } from "@/lib/notifications"

export async function GET() {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const returnRequests = await prisma.returnRequest.findMany({
            where: { userId: session.user.id },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        total: true,
                        placedAt: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(returnRequests)
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    const { error, session } = await requireAuth()
    if (error) return error

    // Only customers can create return requests
    if (session!.user.role !== "CUSTOMER") {
        return NextResponse.json(
            { error: "Only customers can submit return requests" },
            { status: 403 }
        )
    }

    try {
        const body = await req.json()

        const result = returnRequestSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        const { orderId, reason } = result.data
        const userId = session!.user.id

        // Verify the order exists and belongs to this user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        })

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            )
        }

        if (order.userId !== userId) {
            return NextResponse.json(
                { error: "You can only request returns for your own orders" },
                { status: 403 }
            )
        }

        // Only delivered orders can be returned
        if (order.status !== "DELIVERED") {
            return NextResponse.json(
                { error: "Returns can only be requested for delivered orders" },
                { status: 400 }
            )
        }

        // Check for existing return request on this order
        const existingReturn = await prisma.returnRequest.findFirst({
            where: { orderId },
        })

        if (existingReturn) {
            return NextResponse.json(
                { error: "A return request already exists for this order" },
                { status: 409 }
            )
        }

        // Create the return request with PENDING status
        const returnRequest = await prisma.returnRequest.create({
            data: {
                orderId,
                userId,
                reason,
                status: "PENDING",
            },
        })

        // Notify all admins and staff about the new return request
        const adminUsers = await prisma.user.findMany({
            where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
            select: { id: true }
        })

        await createBulkNotification(
            adminUsers.map(a => a.id),
            "New Return Request",
            `Return requested for order ${order.orderNumber} - Reason: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
            "SYSTEM",
            "/admin/returns"
        )

        return NextResponse.json(returnRequest, { status: 201 })
    } catch (error) {

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
