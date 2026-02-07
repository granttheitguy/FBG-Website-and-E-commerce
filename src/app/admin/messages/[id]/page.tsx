import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Mail, Clock, User } from "lucide-react"
import { DeleteMessageButton } from "./delete-message-button"

export default async function AdminMessageDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const { id } = await params

    const message = await prisma.contactMessage.findUnique({
        where: { id },
    })

    if (!message) {
        notFound()
    }

    // Auto-mark as read when viewed (direct DB update, no revalidatePath during render)
    if (!message.isRead) {
        await prisma.contactMessage.update({
            where: { id },
            data: { isRead: true },
        })
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/messages"
                    className="p-2 hover:bg-obsidian-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Back to messages"
                >
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Message from {message.firstName} {message.lastName}
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-0.5">
                        Received {new Date(message.createdAt).toLocaleDateString("en-NG", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
                <DeleteMessageButton messageId={message.id} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Message Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-5">
                            <Mail className="w-4 h-4 text-obsidian-400" />
                            Message
                        </h2>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-sm text-obsidian-700 leading-relaxed whitespace-pre-wrap">
                                {message.message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Sender Info */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-obsidian-400" />
                            Sender
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Name</p>
                                <p className="text-sm font-medium text-obsidian-900">
                                    {message.firstName} {message.lastName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Email</p>
                                <a
                                    href={`mailto:${message.email}`}
                                    className="text-sm text-obsidian-900 hover:text-gold-600 inline-flex items-center gap-1.5 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    {message.email}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-obsidian-400" />
                            Details
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Message ID</p>
                                <p className="text-sm text-obsidian-600 font-mono">
                                    #{message.id.slice(-8).toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Received</p>
                                <p className="text-sm text-obsidian-600">
                                    {new Date(message.createdAt).toLocaleString("en-NG")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-obsidian-500 mb-0.5">Status</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                    Read
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Reply Action */}
                    <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                        <h2 className="font-medium text-obsidian-900 mb-4">Quick Actions</h2>
                        <a
                            href={`mailto:${message.email}?subject=Re: Your message to Fashion By Grant`}
                            className="block w-full text-center px-4 py-2.5 text-sm bg-obsidian-900 text-white rounded-sm hover:bg-obsidian-800 transition-colors min-h-[44px] flex items-center justify-center"
                        >
                            Reply via Email
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
