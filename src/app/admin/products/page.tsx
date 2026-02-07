import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Package, Edit } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import ProductsListFilters from "./ProductsListFilters"

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; category?: string }>
}) {
    const session = await auth()

    if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams
    const where: any = {}

    if (params.q) {
        where.OR = [
            { name: { contains: params.q } },
            { descriptionShort: { contains: params.q } },
        ]
    }

    // Fetch products with related data
    const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            images: { take: 1 },
            variants: true,
            _count: { select: { orderItems: true } }
        }
    })

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Products</h1>
                    <p className="text-sm text-obsidian-500 mt-1">Manage your product catalog and inventory.</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 bg-obsidian-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-obsidian-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </Link>
            </div>

            {/* Filters */}
            <ProductsListFilters currentSearch={params.q || ""} />

            {/* Products Table */}
            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-obsidian-50 border-b border-obsidian-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Product</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Price</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Inventory</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900">Sales</th>
                            <th className="px-6 py-4 font-medium text-obsidian-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-100">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-obsidian-500">
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => {
                                const totalStock = product.variants.reduce((sum, v) => sum + v.stockQty, 0)

                                return (
                                    <tr key={product.id} className="hover:bg-obsidian-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-12 bg-obsidian-100 rounded overflow-hidden flex-shrink-0">
                                                    {product.images[0] ? (
                                                        <img src={product.images[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-obsidian-400">
                                                            <Package className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-obsidian-900">{product.name}</p>
                                                    <p className="text-xs text-obsidian-500 truncate max-w-[200px]">{product.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-obsidian-900">
                                            {formatCurrency(product.basePrice)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-obsidian-100 text-obsidian-800'
                                                }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${totalStock === 0 ? 'text-red-600 font-medium' : 'text-obsidian-600'}`}>
                                                {totalStock} in stock
                                            </span>
                                            <p className="text-xs text-obsidian-400">{product.variants.length} variants</p>
                                        </td>
                                        <td className="px-6 py-4 text-obsidian-600">
                                            {product._count.orderItems} sold
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    className="p-1 text-obsidian-400 hover:text-obsidian-900 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
