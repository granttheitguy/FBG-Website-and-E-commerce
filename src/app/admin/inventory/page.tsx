import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import InventoryClient from "./InventoryClient"

export default async function AdminInventoryPage() {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const variants = await prisma.productVariant.findMany({
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true
                }
            },
            stockMovements: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    // Calculate stats
    const totalVariants = variants.length
    const lowStockCount = variants.filter(v => v.stockQty <= 5 && v.stockQty > 0).length
    const outOfStockCount = variants.filter(v => v.stockQty === 0).length

    const getStockStatus = (stockQty: number) => {
        if (stockQty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
        if (stockQty <= 5) return { label: "Low Stock", color: "bg-amber-100 text-amber-800" }
        return { label: "In Stock", color: "bg-green-100 text-green-800" }
    }

    // Serialize dates for client component
    const serializedVariants = variants.map(v => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        stockMovements: v.stockMovements.map(m => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
        }))
    }))

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-[-0.02em] text-obsidian-900 mb-2">Inventory Management</h1>
                    <p className="text-obsidian-600">Track and manage product stock levels</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="text-obsidian-600 text-sm font-medium mb-1">Total Variants</div>
                    <div className="text-3xl font-serif font-bold text-obsidian-900 font-tabular">{totalVariants}</div>
                </div>
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="text-amber-600 text-sm font-medium mb-1">Low Stock</div>
                    <div className="text-3xl font-serif font-bold text-amber-700 font-tabular">{lowStockCount}</div>
                </div>
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 shadow-sm">
                    <div className="text-red-600 text-sm font-medium mb-1">Out of Stock</div>
                    <div className="text-3xl font-serif font-bold text-red-700 font-tabular">{outOfStockCount}</div>
                </div>
            </div>

            <InventoryClient variants={serializedVariants} />

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-obsidian-50 border-b border-obsidian-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Product</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Variant</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">SKU</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Stock Qty</th>
                                <th className="px-6 py-4 font-medium text-obsidian-900">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-obsidian-100">
                            {variants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-obsidian-500">
                                        No product variants found
                                    </td>
                                </tr>
                            ) : (
                                variants.map((variant) => {
                                    const status = getStockStatus(variant.stockQty)
                                    return (
                                        <tr key={variant.id} className="hover:bg-obsidian-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-obsidian-900">{variant.product.name}</div>
                                                <div className="text-xs text-obsidian-500">{variant.product.slug}</div>
                                            </td>
                                            <td className="px-6 py-4 text-obsidian-600">
                                                {variant.size && <span className="mr-2">Size: {variant.size}</span>}
                                                {variant.color && <span>Color: {variant.color}</span>}
                                                {!variant.size && !variant.color && "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-obsidian-50 px-2 py-1 rounded text-obsidian-900 font-mono">
                                                    {variant.sku}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-tabular font-semibold ${variant.stockQty === 0 ? "text-red-600" : variant.stockQty <= 5 ? "text-amber-600" : "text-green-600"}`}>
                                                    {variant.stockQty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
