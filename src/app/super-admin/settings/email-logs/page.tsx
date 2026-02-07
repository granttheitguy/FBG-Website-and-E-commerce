import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Search, Mail, AlertCircle, CheckCircle } from "lucide-react"

export default async function EmailLogsPage({
    searchParams,
}: {
    searchParams: { q?: string; status?: string }
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        redirect("/admin/dashboard")
    }

    const where: any = {}

    if (searchParams.q) {
        where.OR = [
            { toEmail: { contains: searchParams.q } },
            { subject: { contains: searchParams.q } },
        ]
    }

    if (searchParams.status) {
        where.status = searchParams.status
    }

    const logs = await prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: "desc" },
        take: 50
    })

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Email Logs</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Monitor outgoing system emails.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-sm border border-obsidian-200 shadow-sm mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
                    <input
                        type="text"
                        placeholder="Search email or subject..."
                        className="w-full pl-10 pr-4 py-2 rounded-sm border border-obsidian-300 text-sm focus:border-obsidian-900 focus:ring-obsidian-900"
                    />
                </div>
                <select className="rounded-sm border border-obsidian-300 text-sm focus:border-obsidian-900 focus:ring-obsidian-900 px-4 py-2">
                    <option value="">All Statuses</option>
                    <option value="SENT">Sent</option>
                    <option value="FAILED">Failed</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">To</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Subject</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Template</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                    No email logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {log.status === 'SENT' ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className={`text-xs font-medium ${log.status === 'SENT' ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-900">
                                        {log.toEmail}
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {log.subject}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-obsidian-100 text-obsidian-800">
                                            {log.templateName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-obsidian-500">
                                        {new Date(log.sentAt).toLocaleString()}
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
