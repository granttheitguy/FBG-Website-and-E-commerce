import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Palette, MapPin, Package } from "lucide-react"
import FabricStockAlert from "@/components/features/admin/FabricStockAlert"

export default async function FabricDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const { id } = await params

    const fabric = await prisma.fabricInventory.findUnique({
        where: { id },
        include: {
            supplier: true,
        },
    })

    if (!fabric) {
        notFound()
    }

    const isLowStock = fabric.minStockLevel > 0 && fabric.quantityYards <= fabric.minStockLevel

    return (
        <div className="p-8 max-w-4xl">
            {/* Back link */}
            <Link
                href="/admin/fabrics"
                className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Fabrics
            </Link>

            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        {fabric.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-obsidian-50 text-obsidian-600 border border-obsidian-200">
                            {fabric.type}
                        </span>
                        {fabric.color && (
                            <span className="text-sm text-obsidian-500">{fabric.color}</span>
                        )}
                        {!fabric.isAvailable && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                Unavailable
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stock info */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Stock Level
                    </h2>

                    <div className="text-center py-4">
                        <p className={`text-3xl font-bold font-tabular ${
                            isLowStock ? "text-red-600" : "text-obsidian-900"
                        }`}>
                            {fabric.quantityYards.toFixed(1)}
                        </p>
                        <p className="text-sm text-obsidian-500 mt-1">yards in stock</p>

                        {isLowStock && (
                            <div className="mt-3">
                                <FabricStockAlert
                                    quantityYards={fabric.quantityYards}
                                    minStockLevel={fabric.minStockLevel}
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-obsidian-100 pt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-obsidian-500">Min Stock Level</span>
                            <span className="font-tabular text-obsidian-700">
                                {fabric.minStockLevel > 0 ? `${fabric.minStockLevel.toFixed(1)} yards` : "--"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-obsidian-500">Cost per Yard</span>
                            <span className="font-tabular text-obsidian-700">
                                {fabric.costPerYard ? formatCurrency(fabric.costPerYard) : "--"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-obsidian-500">Total Value</span>
                            <span className="font-tabular font-medium text-obsidian-900">
                                {fabric.costPerYard
                                    ? formatCurrency(fabric.costPerYard * fabric.quantityYards)
                                    : "--"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Details
                    </h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-obsidian-500">Type</span>
                            <span className="text-obsidian-700">{fabric.type}</span>
                        </div>
                        {fabric.color && (
                            <div className="flex justify-between">
                                <span className="text-obsidian-500">Color</span>
                                <span className="text-obsidian-700">{fabric.color}</span>
                            </div>
                        )}
                        {fabric.pattern && (
                            <div className="flex justify-between">
                                <span className="text-obsidian-500">Pattern</span>
                                <span className="text-obsidian-700">{fabric.pattern}</span>
                            </div>
                        )}
                        {fabric.location && (
                            <div className="flex justify-between">
                                <span className="text-obsidian-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Location
                                </span>
                                <span className="text-obsidian-700">{fabric.location}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-obsidian-500">Available</span>
                            <span className={fabric.isAvailable ? "text-green-600" : "text-red-600"}>
                                {fabric.isAvailable ? "Yes" : "No"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-obsidian-500">Added</span>
                            <span className="text-obsidian-700">{formatDate(fabric.createdAt)}</span>
                        </div>
                    </div>

                    {fabric.notes && (
                        <div className="mt-4 pt-3 border-t border-obsidian-100">
                            <p className="text-xs font-medium text-obsidian-500 mb-1">Notes</p>
                            <p className="text-sm text-obsidian-700 whitespace-pre-wrap">{fabric.notes}</p>
                        </div>
                    )}
                </div>

                {/* Supplier */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4">
                        Supplier
                    </h2>

                    {fabric.supplier ? (
                        <div className="space-y-3 text-sm">
                            <div>
                                <Link
                                    href={`/admin/suppliers/${fabric.supplier.id}`}
                                    className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors"
                                >
                                    {fabric.supplier.name}
                                </Link>
                            </div>
                            {fabric.supplier.contactName && (
                                <div className="flex justify-between">
                                    <span className="text-obsidian-500">Contact</span>
                                    <span className="text-obsidian-700">{fabric.supplier.contactName}</span>
                                </div>
                            )}
                            {fabric.supplier.phone && (
                                <div className="flex justify-between">
                                    <span className="text-obsidian-500">Phone</span>
                                    <span className="text-obsidian-700">{fabric.supplier.phone}</span>
                                </div>
                            )}
                            {fabric.supplier.email && (
                                <div className="flex justify-between">
                                    <span className="text-obsidian-500">Email</span>
                                    <span className="text-obsidian-700 truncate max-w-[150px]">{fabric.supplier.email}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-obsidian-400">No supplier assigned.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
