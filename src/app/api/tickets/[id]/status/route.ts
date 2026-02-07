import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        // Only Staff/Admin can update status
        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 })
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        })

        // Optionally create a system message about status change
        await prisma.supportTicketMessage.create({
            data: {
                ticketId: id,
                senderUserId: session.user.id,
                message: `changed status to ${status.replace("_", " ")}`,
                isInternal: true
            }
        })

        return NextResponse.json(ticket)
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
