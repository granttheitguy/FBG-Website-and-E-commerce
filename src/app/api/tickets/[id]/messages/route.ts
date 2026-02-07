import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { createNotification, createBulkNotification } from "@/lib/notifications"

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // For form submission, we might need to parse FormData if not JSON
        // But let's support JSON first for consistency, or check content-type.
        // The client component uses form action which sends FormData by default if using server actions,
        // but here I used a standard form pointing to API route.
        // Wait, standard form action to API route sends x-www-form-urlencoded or multipart/form-data.
        // Let's handle both or just use client-side fetch in the ReplyForm component for better UX (no reload).
        // Actually, I defined ReplyForm as a standard HTML form in the previous step pointing to this route.
        // I should probably update ReplyForm to be a client component to handle JSON submission and loading state.
        // But for now, let's handle FormData here to support the existing code.

        const contentType = req.headers.get("content-type") || ""
        let message = ""

        if (contentType.includes("application/json")) {
            const body = await req.json()
            message = body.message
        } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData()
            message = formData.get("message") as string
        }

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        // Check ticket existence and permissions
        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        })

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }

        // Allow user if they own it, or if they are staff/admin
        const isOwner = ticket.userId === session.user.id
        const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN" || session.user.role === "STAFF"

        if (!isOwner && !isStaff) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Create message
        await prisma.supportTicketMessage.create({
            data: {
                ticketId: id,
                senderUserId: session.user.id,
                message,
                isInternal: false // Default to public
            }
        })

        // Update ticket updated_at
        await prisma.supportTicket.update({
            where: { id },
            data: { updatedAt: new Date() }
        })

        // If sender is staff, notify customer
        if (isStaff) {
            // Send notification to customer
            await createNotification(
                ticket.userId,
                "New Reply on Support Ticket",
                `You have a new reply on ticket: ${ticket.subject}`,
                "SUPPORT",
                `/account/tickets/${ticket.id}`
            )

            try {
                // Fetch customer email
                const customer = await prisma.user.findUnique({
                    where: { id: ticket.userId },
                    select: { email: true, name: true }
                })

                if (customer?.email) {
                    await sendEmail(
                        customer.email,
                        `New Reply on Ticket #${ticket.id.slice(-6).toUpperCase()}`,
                        `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #C8973E;">New Reply on Your Support Ticket</h1>
                                <p>Hello ${customer.name},</p>
                                <p>You have a new reply on your support ticket:</p>
                                <div style="background-color: #F7F3ED; padding: 20px; border-radius: 4px; margin: 20px 0;">
                                    <p style="margin: 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                                    <p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
                                    <blockquote style="margin: 10px 0 0 0; padding-left: 15px; border-left: 3px solid #C8973E;">
                                        ${escapeHtml(message)}
                                    </blockquote>
                                </div>
                                <p>
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/tickets/${ticket.id}"
                                       style="background-color: #C8973E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                        View Ticket
                                    </a>
                                </p>
                            </div>
                        `,
                        `Hello ${customer.name}, You have a new reply on your support ticket: "${message}". View at: ${process.env.NEXT_PUBLIC_APP_URL}/account/tickets/${ticket.id}`
                    )
                }
            } catch {
                // Email failure should not block message creation
            }
        } else {
            // Customer replied - notify all admins and staff
            const adminUsers = await prisma.user.findMany({
                where: { role: { in: ["ADMIN", "SUPER_ADMIN", "STAFF"] } },
                select: { id: true }
            })

            await createBulkNotification(
                adminUsers.map(a => a.id),
                "New Ticket Reply",
                `Customer replied to ticket: ${ticket.subject}`,
                "SUPPORT",
                `/admin/tickets/${ticket.id}`
            )
        }

        // If submitted via form, redirect back
        if (!contentType.includes("application/json")) {
            // Redirect back to ticket page
            // We need to know the referrer or just construct path
            // Since we are in /api/tickets/[id]/messages, we can redirect to /account/tickets/[id] or /admin/tickets/[id]
            // But we don't know which one easily without checking referrer or role.
            // Let's rely on referrer if possible, or just return success and let client handle.
            // But standard form submission expects a redirect or page load.
            // I'll update the ReplyForm to be a client component in the next step to avoid this ambiguity.
            const referer = req.headers.get("referer")
            const requestOrigin = new URL(req.url).origin
            let redirectTarget = `/account/tickets/${id}`
            if (referer) {
                try {
                    const refererUrl = new URL(referer)
                    if (refererUrl.origin === requestOrigin) {
                        redirectTarget = referer
                    }
                } catch {
                    // Invalid referer URL, use fallback
                }
            }
            return NextResponse.redirect(new URL(redirectTarget, req.url))
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
