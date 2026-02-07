import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import CollectionsClient from "./CollectionsClient"

export default async function AdminCollectionsPage() {
    const session = await auth()

    // Only Super Admin and Admin can view collections
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const collections = await prisma.collection.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { products: true }
            }
        }
    })

    // Serialize dates for client component
    const serializedCollections = collections.map(collection => ({
        ...collection,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
    }))

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Collections</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Curate product collections for featured displays and marketing.</p>
                </div>
            </div>

            <CollectionsClient initialCollections={serializedCollections} />
        </div>
    )
}
