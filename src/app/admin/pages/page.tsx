import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Edit, FileText, ExternalLink } from "lucide-react"
import DeletePageButton from "./_components/DeletePageButton"

export default async function AdminPagesPage() {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const pages = await prisma.pageContent.findMany({
        orderBy: { updatedAt: "desc" },
    })

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Pages</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Manage your site content pages.</p>
                </div>
                <Link
                    href="/admin/pages/new"
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create New Page
                </Link>
            </div>

            {/* Pages Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Title</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Slug</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Published</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Last Updated</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {pages.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <FileText className="w-10 h-10 text-obsidian-200 mx-auto mb-3" />
                                    <p className="text-obsidian-500 text-sm">No pages found.</p>
                                    <Link
                                        href="/admin/pages/new"
                                        className="text-sm text-gold-500 hover:text-gold-600 mt-2 inline-block"
                                    >
                                        Create your first page
                                    </Link>
                                </td>
                            </tr>
                        ) : (
                            pages.map((page) => (
                                <tr key={page.id} className="hover:bg-obsidian-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-obsidian-100 rounded flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-obsidian-400" />
                                            </div>
                                            <span className="font-medium text-obsidian-900">{page.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <code className="text-xs bg-obsidian-50 px-2 py-0.5 rounded text-obsidian-600">
                                                /{page.slug}
                                            </code>
                                            <a
                                                href={`/${page.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-obsidian-400 hover:text-obsidian-600 transition-colors"
                                                aria-label={`View ${page.title} page`}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                page.isPublished
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-obsidian-100 text-obsidian-600"
                                            }`}
                                        >
                                            {page.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-obsidian-500">
                                        {new Intl.DateTimeFormat("en-GB", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }).format(page.updatedAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/pages/${page.id}/edit`}
                                                className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors px-2 py-1"
                                            >
                                                <Edit className="w-4 h-4" />
                                                <span className="sr-only sm:not-sr-only">Edit</span>
                                            </Link>
                                            <DeletePageButton pageId={page.id} pageTitle={page.title} />
                                        </div>
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
