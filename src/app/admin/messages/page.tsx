import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Inbox, Mail } from "lucide-react"

export default async function AdminMessagesPage() {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
    })

    const unreadCount = messages.filter((m) => !m.isRead).length

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Messages
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Contact form submissions from visitors.
                        {unreadCount > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
                                {unreadCount} unread
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900 w-8">
                                <span className="sr-only">Read status</span>
                            </th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Name</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Email</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Message</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Date</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {messages.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-obsidian-500">
                                    <Inbox className="w-8 h-8 mx-auto mb-2 text-obsidian-300" />
                                    No messages yet.
                                </td>
                            </tr>
                        ) : (
                            messages.map((message) => (
                                <tr
                                    key={message.id}
                                    className={`hover:bg-obsidian-50 transition-colors ${
                                        !message.isRead ? "bg-gold-50" : ""
                                    }`}
                                >
                                    <td className="pl-6 py-4">
                                        {!message.isRead ? (
                                            <span
                                                className="block w-2.5 h-2.5 rounded-full bg-gold-500"
                                                aria-label="Unread message"
                                            />
                                        ) : (
                                            <span
                                                className="block w-2.5 h-2.5 rounded-full bg-obsidian-200"
                                                aria-label="Read message"
                                            />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className={`text-obsidian-900 ${!message.isRead ? "font-semibold" : "font-medium"}`}>
                                            {message.firstName} {message.lastName}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {message.email}
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600 max-w-xs">
                                        <p className="truncate">
                                            {message.message}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600 whitespace-nowrap">
                                        {new Date(message.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/messages/${message.id}`}
                                            className="text-obsidian-400 hover:text-obsidian-900 font-medium transition-colors"
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

            <p className="text-xs text-obsidian-400 mt-3">
                {messages.length} message{messages.length !== 1 ? "s" : ""} total
            </p>
        </div>
    )
}
