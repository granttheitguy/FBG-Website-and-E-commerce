import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Palette, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import FabricsPageClient from "./FabricsPageClient"
import type { FabricDetail } from "@/types/erp"

export default async function AdminFabricsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; lowStock?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams
    const search = params.search || ""
    const lowStockOnly = params.lowStock === "true"
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { type: { contains: search, mode: "insensitive" } },
            { color: { contains: search, mode: "insensitive" } },
        ]
    }

    const [allFabrics, total, suppliers] = await Promise.all([
        prisma.fabricInventory.findMany({
            where,
            orderBy: { name: "asc" },
            include: {
                supplier: { select: { id: true, name: true } },
            },
        }),
        prisma.fabricInventory.count({ where }),
        prisma.supplier.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ])

    // Filter low stock in application layer
    const lowStockCount = allFabrics.filter(
        (f) => f.minStockLevel > 0 && f.quantityYards <= f.minStockLevel
    ).length

    let displayFabrics = lowStockOnly
        ? allFabrics.filter((f) => f.minStockLevel > 0 && f.quantityYards <= f.minStockLevel)
        : allFabrics

    // Apply pagination
    const filteredTotal = displayFabrics.length
    displayFabrics = displayFabrics.slice(skip, skip + limit)
    const totalPages = Math.ceil(filteredTotal / limit)

    const serializedFabrics: FabricDetail[] = displayFabrics.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
    }))

    return (
        <FabricsPageClient
            fabrics={serializedFabrics}
            suppliers={suppliers}
            total={filteredTotal}
            page={page}
            totalPages={totalPages}
            lowStockCount={lowStockCount}
            currentSearch={search}
            isLowStockFilter={lowStockOnly}
            skip={skip}
            limit={limit}
        />
    )
}
