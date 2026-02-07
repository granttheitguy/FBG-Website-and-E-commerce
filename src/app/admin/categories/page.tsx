import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import CategoriesClient from "./CategoriesClient"

export default async function AdminCategoriesPage() {
    const session = await auth()

    // Only Super Admin and Admin can view categories
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
            parent: {
                select: { id: true, name: true }
            },
            _count: {
                select: { products: true }
            }
        }
    })

    // Serialize dates for client component
    const serializedCategories = categories.map(category => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
    }))

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Categories</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Organize your products into hierarchical categories.</p>
                </div>
            </div>

            <CategoriesClient initialCategories={serializedCategories} />
        </div>
    )
}
