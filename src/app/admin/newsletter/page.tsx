import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Mail, Users, UserCheck, UserX } from "lucide-react"
import { NewsletterTable } from "./newsletter-table"
import { ExportCsvButton } from "./export-csv-button"

export default async function AdminNewsletterPage() {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: "desc" },
    })

    const totalSubscribers = subscribers.length
    const activeSubscribers = subscribers.filter((s) => s.isSubscribed).length
    const unsubscribedCount = subscribers.filter((s) => !s.isSubscribed).length

    const stats = [
        {
            label: "Total Subscribers",
            value: totalSubscribers,
            icon: Users,
            color: "text-obsidian-600",
            bg: "bg-obsidian-50",
        },
        {
            label: "Active",
            value: activeSubscribers,
            icon: UserCheck,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Unsubscribed",
            value: unsubscribedCount,
            icon: UserX,
            color: "text-red-600",
            bg: "bg-red-50",
        },
    ]

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Newsletter
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Manage newsletter subscribers and export mailing lists.
                    </p>
                </div>
                <ExportCsvButton />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.label}
                            className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-5"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-sm ${stat.bg} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold font-tabular text-obsidian-900">
                                        {stat.value.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-obsidian-500">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Table */}
            <NewsletterTable subscribers={subscribers} />
        </div>
    )
}
