import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, FileText, MoreHorizontal } from "lucide-react"

export default async function EmailTemplatesPage() {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        redirect("/admin/dashboard")
    }

    const templates = await prisma.emailTemplate.findMany({
        orderBy: { name: "asc" }
    })

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Email Templates</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Manage the content of system emails.</p>
                </div>
                <Link
                    href="/super-admin/settings/templates/new"
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </Link>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Template Name</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Subject</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Last Updated</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {templates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                    No templates found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            templates.map((template) => (
                                <tr key={template.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-obsidian-100 flex items-center justify-center text-obsidian-500">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-obsidian-900">{template.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {template.subject}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-obsidian-100 text-obsidian-600'
                                            }`}>
                                            {template.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-600">
                                        {new Date(template.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/super-admin/settings/templates/${template.id}`}
                                            className="text-obsidian-400 hover:text-obsidian-900"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
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
