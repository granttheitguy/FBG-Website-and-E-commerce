import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, User, Shield } from "lucide-react"
import ReplyForm from "@/components/features/account/ReplyForm"

function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    return Math.floor(seconds) + " seconds ago"
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
            messages: {
                include: { sender: true },
                orderBy: { createdAt: "asc" }
            },
            order: true
        }
    })

    if (!ticket) {
        notFound()
    }

    // Security check: Ensure user owns the ticket
    if (ticket.userId !== session.user.id) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/account/tickets" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-obsidian-900">#{ticket.id.slice(-6).toUpperCase()}</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                                ticket.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
                                    ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700' :
                                        'bg-obsidian-100 text-obsidian-600'
                                }`}>
                                {ticket.status.replace("_", " ")}
                            </span>
                        </div>
                        <p className="text-obsidian-900 font-medium mt-1">{ticket.subject}</p>
                    </div>
                </div>
                {ticket.order && (
                    <Link href={`/account/orders/${ticket.order.id}`} className="text-sm text-obsidian-500 hover:text-obsidian-900 hover:underline">
                        Related Order: #{ticket.order.orderNumber}
                    </Link>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-white border border-obsidian-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-obsidian-50">
                    {ticket.messages.map((msg) => {
                        const isMe = msg.senderUserId === session.user.id
                        const isStaff = msg.sender.role === 'ADMIN' || msg.sender.role === 'SUPER_ADMIN' || msg.sender.role === 'STAFF'

                        return (
                            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-obsidian-200' : isStaff ? 'bg-obsidian-900 text-white' : 'bg-obsidian-200'
                                    }`}>
                                    {isStaff ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4 text-obsidian-500" />}
                                </div>
                                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`flex items-center gap-2 mb-1 text-xs text-obsidian-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="font-medium text-obsidian-900">
                                            {isMe ? 'You' : msg.sender.name}
                                        </span>
                                        <span>•</span>
                                        <span>{timeAgo(new Date(msg.createdAt))}</span>
                                    </div>
                                    <div className={`p-4 rounded-sm text-sm whitespace-pre-wrap ${isMe ? 'bg-obsidian-900 text-white rounded-tr-none' : 'bg-white border border-obsidian-200 rounded-tl-none text-obsidian-800'
                                        }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Reply Box */}
                <div className="p-4 bg-white border-t border-obsidian-200">
                    {ticket.status === 'CLOSED' ? (
                        <div className="text-center text-obsidian-500 text-sm py-4 bg-obsidian-50 rounded-sm">
                            This ticket is closed. Please create a new ticket for further assistance.
                        </div>
                    ) : (
                        <ReplyForm ticketId={ticket.id} />
                    )}
                </div>
            </div>
        </div>
    )
}
