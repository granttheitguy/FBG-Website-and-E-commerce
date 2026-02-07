import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, MessageSquare, AlertCircle } from "lucide-react"

export default async function TicketsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const tickets = await prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { messages: true } }
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-obsidian-900">Support Tickets</h1>
                    <p className="text-obsidian-500 mt-1">View and manage your support requests.</p>
                </div>
                <Link
                    href="/account/tickets/new"
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Ticket
                </Link>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                {tickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-obsidian-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-6 h-6 text-obsidian-400" />
                        </div>
                        <h3 className="text-lg font-medium text-obsidian-900 mb-2">No tickets yet</h3>
                        <p className="text-obsidian-500 mb-6">Need help with an order? Create a new support ticket.</p>
                        <Link
                            href="/account/tickets/new"
                            className="inline-flex items-center gap-2 text-obsidian-900 font-medium hover:underline"
                        >
                            Create your first ticket →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-obsidian-100">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/account/tickets/${ticket.id}`}
                                className="block p-6 hover:bg-obsidian-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-obsidian-900">#{ticket.id.slice(-6).toUpperCase()}</span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                                                    ticket.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
                                                        ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700' :
                                                            'bg-obsidian-100 text-obsidian-600'
                                                }`}>
                                                {ticket.status.replace("_", " ")}
                                            </span>
                                            {ticket.priority === 'URGENT' && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                                    <AlertCircle className="w-3 h-3" /> Urgent
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-obsidian-900 font-medium">{ticket.subject}</h3>
                                        <p className="text-sm text-obsidian-500">
                                            Last updated {new Date(ticket.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-obsidian-400">
                                        <div className="flex items-center gap-1 text-sm">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{ticket._count.messages}</span>
                                        </div>
                                        <span className="text-2xl">›</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
