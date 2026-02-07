import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { ticketSchema } from "@/lib/validation-schemas"
import { requireAuth } from "@/lib/rbac"

export async function POST(req: Request) {
    // Check authorization
    const { error, session } = await requireAuth()
    if (error) return error

    try {
        const body = await req.json()

        // Validate input
        const validatedData = ticketSchema.parse(body)
        const { subject, message, priority, orderId } = validatedData

        // Find related order if provided
        let relatedOrder = null
        if (orderId) {
            relatedOrder = await prisma.order.findFirst({
                where: {
                    OR: [
                        { id: orderId },
                        { orderNumber: orderId }
                    ],
                    // Ensure order belongs to user
                    userId: session.user.id
                }
            })
        }

        // Create Ticket and Initial Message
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                subject,
                priority: priority || "NORMAL",
                orderId: relatedOrder ? relatedOrder.id : undefined,
                messages: {
                    create: {
                        senderUserId: session.user.id,
                        message,
                        isInternal: false
                    }
                }
            }
        })

        // Send Ticket Received Email
        try {
            await sendEmail(
                session.user.email!,
                `Support Ticket Received: ${subject}`,
                `<h1>We received your ticket</h1><p>Ticket ID: ${ticket.id}</p><p>We will get back to you shortly.</p>`,
                `We received your ticket. Ticket ID: ${ticket.id}. We will get back to you shortly.`
            )
        } catch {
            // Email failure should not block ticket creation
        }

        return NextResponse.json(ticket)
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
