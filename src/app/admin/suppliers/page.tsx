import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Truck, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import SuppliersPageClient from "./SuppliersPageClient"
import type { SupplierDetail } from "@/types/erp"

export default async function AdminSuppliersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const params = await searchParams
    const search = params.search || ""
    const page = Math.max(1, parseInt(params.page || "1", 10))
    const limit = 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
        ]
    }

    const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
            include: {
                _count: { select: { fabrics: true } },
            },
        }),
        prisma.supplier.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    const serializedSuppliers: SupplierDetail[] = suppliers.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    }))

    return (
        <SuppliersPageClient
            suppliers={serializedSuppliers}
            total={total}
            page={page}
            totalPages={totalPages}
            currentSearch={search}
            skip={skip}
            limit={limit}
        />
    )
}
