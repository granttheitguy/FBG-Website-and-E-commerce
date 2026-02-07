import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, AlertCircle } from "lucide-react"
import TicketsListFilters from "./TicketsListFilters"

export default async function AdminTicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>
}) {
    const session = await auth()

    if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams
    const where: any = {}

    if (params.q) {
        where.OR = [
            { subject: { contains: params.q } },
            { id: { contains: params.q } },
        ]
    }

    if (params.status) {
        where.status = params.status
    }

    const tickets = await prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
            user: true,
            _count: { select: { messages: true } }
        }
    })

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Support Tickets</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Manage customer support requests.</p>
                </div>
            </div>

            {/* Filters */}
            <TicketsListFilters currentSearch={params.q || ""} currentStatus={params.status || ""} />

            {/* Tickets Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Ticket</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Customer</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Priority</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Last Updated</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-obsidian-500">
                                    No tickets found.
                                </td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-obsidian-100 flex items-center justify-center text-obsidian-500">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-obsidian-900 truncate max-w-[200px]">{ticket.subject}</p>
                                                <p className="text-xs text-obsidian-500">#{ticket.id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {ticket.user.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                                                ticket.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
                                                    ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700' :
                                                        'bg-obsidian-100 text-obsidian-600'
                                            }`}>
                                            {ticket.status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${ticket.priority === 'URGENT' ? 'text-red-700 bg-red-50 px-2 py-0.5 rounded-full' :
                                                ticket.priority === 'HIGH' ? 'text-orange-700' :
                                                    'text-obsidian-600'
                                            }`}>
                                            {ticket.priority === 'URGENT' && <AlertCircle className="w-3 h-3" />}
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {new Date(ticket.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/tickets/${ticket.id}`}
                                            className="text-obsidian-400 hover:text-obsidian-900 font-medium"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
