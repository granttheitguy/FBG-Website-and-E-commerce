import { prisma } from "@/lib/db"
import { Search, Activity, User, Calendar } from "lucide-react"

export default async function ActivityLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; type?: string }>
}) {
    const { q, type } = await searchParams

    const where: any = {}

    if (q) {
        where.OR = [
            { action: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
        ]
    }

    if (type) {
        where.entityType = type
    }

    const logs = await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            user: true
        },
        take: 50 // Limit to last 50 for performance
    })

    return (
        <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-medium text-obsidian-900">Activity Logs</h1>
                        <p className="text-sm text-obsidian-500 mt-1">Monitor system actions and security events.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-sm border border-obsidian-200 shadow-sm mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
                        <input
                            type="text"
                            placeholder="Search action or user..."
                            className="w-full pl-10 pr-4 py-2 rounded-sm border border-obsidian-300 text-sm focus:border-obsidian-900 focus:ring-obsidian-900"
                        />
                    </div>
                    <select className="rounded-sm border border-obsidian-300 text-sm focus:border-obsidian-900 focus:ring-obsidian-900 px-4 py-2">
                        <option value="">All Types</option>
                        <option value="PRODUCT">Product</option>
                        <option value="ORDER">Order</option>
                        <option value="USER">User</option>
                        <option value="AUTH">Auth</option>
                    </select>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Action</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">User</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Entity</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Details</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                        No activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-obsidian-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-obsidian-100 flex items-center justify-center text-obsidian-500">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-obsidian-900">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-obsidian-400" />
                                                <span className="text-obsidian-600">{log.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.entityType && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-obsidian-100 text-obsidian-800">
                                                    {log.entityType}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-500 text-xs font-mono truncate max-w-[200px]">
                                            {log.metadata ? JSON.stringify(log.metadata) : null}
                                        </td>
                                        <td className="px-6 py-4 text-right text-obsidian-500">
                                            {new Date(log.createdAt).toLocaleString()}
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

