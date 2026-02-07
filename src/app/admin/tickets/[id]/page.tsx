import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, User, Shield, Package } from "lucide-react"
import ReplyForm from "@/components/features/account/ReplyForm"
import TicketStatusSelect from "@/components/features/admin/TicketStatusSelect"

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

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
        redirect("/admin/dashboard")
    }

    const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
            user: true,
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

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-obsidian-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tickets" className="p-2 hover:bg-obsidian-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-obsidian-900">#{ticket.id.slice(-6).toUpperCase()}</h1>
                            <TicketStatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
                        </div>
                        <p className="text-obsidian-900 font-medium mt-1">{ticket.subject}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-obsidian-600">
                        <User className="w-4 h-4" />
                        <Link href={`/admin/users/${ticket.userId}`} className="hover:underline hover:text-obsidian-900">
                            {ticket.user.name}
                        </Link>
                    </div>
                    {ticket.order && (
                        <div className="flex items-center gap-2 text-obsidian-600">
                            <Package className="w-4 h-4" />
                            <Link href={`/admin/orders/${ticket.order.id}`} className="hover:underline hover:text-obsidian-900">
                                Order #{ticket.order.orderNumber}
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-obsidian-50">
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {ticket.messages.map((msg) => {
                        const isMe = msg.senderUserId === session.user.id
                        const isStaff = msg.sender.role === 'ADMIN' || msg.sender.role === 'SUPER_ADMIN' || msg.sender.role === 'STAFF'

                        return (
                            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isStaff ? 'bg-obsidian-900 text-white' : 'bg-obsidian-200'
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
                <div className="p-6 bg-white border-t border-obsidian-200">
                    <ReplyForm ticketId={ticket.id} />
                </div>
            </div>
        </div>
    )
}
