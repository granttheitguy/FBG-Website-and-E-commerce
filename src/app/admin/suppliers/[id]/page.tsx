import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Phone, Mail, MapPin, MessageCircle, Palette } from "lucide-react"
import FabricStockAlert from "@/components/features/admin/FabricStockAlert"

export default async function SupplierDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const { id } = await params

    const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
            fabrics: {
                orderBy: { name: "asc" },
            },
            _count: { select: { fabrics: true } },
        },
    })

    if (!supplier) {
        notFound()
    }

    return (
        <div className="p-8 max-w-4xl">
            {/* Back link */}
            <Link
                href="/admin/suppliers"
                className="inline-flex items-center gap-1.5 text-sm text-obsidian-500 hover:text-obsidian-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Suppliers
            </Link>

            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        {supplier.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        {supplier.contactName && (
                            <span className="text-sm text-obsidian-500">{supplier.contactName}</span>
                        )}
                        {!supplier.isActive && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                Inactive
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact info */}
                <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4">
                        Contact Information
                    </h2>

                    <div className="space-y-3 text-sm">
                        {supplier.contactName && (
                            <div className="flex items-start gap-3">
                                <span className="text-obsidian-500 min-w-[80px]">Contact</span>
                                <span className="text-obsidian-700">{supplier.contactName}</span>
                            </div>
                        )}

                        {supplier.phone && (
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-obsidian-400 mt-0.5 flex-shrink-0" />
                                <span className="text-obsidian-700">{supplier.phone}</span>
                            </div>
                        )}

                        {supplier.whatsapp && (
                            <div className="flex items-start gap-3">
                                <MessageCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <a
                                    href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:underline"
                                >
                                    {supplier.whatsapp}
                                </a>
                            </div>
                        )}

                        {supplier.email && (
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-obsidian-400 mt-0.5 flex-shrink-0" />
                                <a
                                    href={`mailto:${supplier.email}`}
                                    className="text-obsidian-700 hover:text-gold-600 transition-colors"
                                >
                                    {supplier.email}
                                </a>
                            </div>
                        )}

                        {(supplier.address || supplier.city || supplier.state) && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-obsidian-400 mt-0.5 flex-shrink-0" />
                                <span className="text-obsidian-700">
                                    {[supplier.address, supplier.city, supplier.state].filter(Boolean).join(", ")}
                                </span>
                            </div>
                        )}
                    </div>

                    {supplier.notes && (
                        <div className="mt-4 pt-3 border-t border-obsidian-100">
                            <p className="text-xs font-medium text-obsidian-500 mb-1">Notes</p>
                            <p className="text-sm text-obsidian-700 whitespace-pre-wrap">{supplier.notes}</p>
                        </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-obsidian-100 text-xs text-obsidian-400">
                        Added {formatDate(supplier.createdAt)}
                    </div>
                </div>

                {/* Fabrics list */}
                <div className="lg:col-span-2 bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-obsidian-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Fabrics ({supplier._count.fabrics})
                    </h2>

                    {supplier.fabrics.length === 0 ? (
                        <p className="text-sm text-obsidian-400 py-4 text-center">
                            No fabrics from this supplier yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-obsidian-200">
                                    <tr>
                                        <th className="pb-3 font-medium text-obsidian-900">Name</th>
                                        <th className="pb-3 font-medium text-obsidian-900">Type</th>
                                        <th className="pb-3 font-medium text-obsidian-900 text-right">Qty</th>
                                        <th className="pb-3 font-medium text-obsidian-900 text-right">Cost/yd</th>
                                        <th className="pb-3 font-medium text-obsidian-900">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-obsidian-100">
                                    {supplier.fabrics.map((fabric) => {
                                        const isLowStock = fabric.minStockLevel > 0 && fabric.quantityYards <= fabric.minStockLevel

                                        return (
                                            <tr
                                                key={fabric.id}
                                                className={`hover:bg-obsidian-50/50 transition-colors ${
                                                    isLowStock ? "bg-red-50/30" : ""
                                                }`}
                                            >
                                                <td className="py-3">
                                                    <Link
                                                        href={`/admin/fabrics/${fabric.id}`}
                                                        className="font-medium text-obsidian-900 hover:text-gold-600 transition-colors"
                                                    >
                                                        {fabric.name}
                                                    </Link>
                                                    {fabric.color && (
                                                        <p className="text-xs text-obsidian-500">{fabric.color}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 text-obsidian-600">{fabric.type}</td>
                                                <td className={`py-3 text-right font-tabular ${
                                                    isLowStock ? "text-red-600 font-medium" : "text-obsidian-600"
                                                }`}>
                                                    {fabric.quantityYards.toFixed(1)} yd
                                                </td>
                                                <td className="py-3 text-right font-tabular text-obsidian-600">
                                                    {fabric.costPerYard ? formatCurrency(fabric.costPerYard) : "--"}
                                                </td>
                                                <td className="py-3">
                                                    {isLowStock ? (
                                                        <FabricStockAlert
                                                            quantityYards={fabric.quantityYards}
                                                            minStockLevel={fabric.minStockLevel}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-green-600">OK</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
