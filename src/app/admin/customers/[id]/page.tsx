import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Customer360Client from "./Customer360Client"

export default async function AdminCustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const { id } = await params

    const customer = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            profile: {
                select: {
                    phone: true,
                    defaultShippingAddress: true,
                    notes: true,
                },
            },
            orders: {
                orderBy: { placedAt: "desc" },
                take: 50,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentStatus: true,
                    total: true,
                    currency: true,
                    placedAt: true,
                    items: {
                        select: {
                            nameSnapshot: true,
                            quantity: true,
                            unitPrice: true,
                            totalPrice: true,
                        },
                    },
                },
            },
            measurements: {
                orderBy: { updatedAt: "desc" },
            },
            customerInteractions: {
                orderBy: { createdAt: "desc" },
                take: 50,
                select: {
                    id: true,
                    type: true,
                    subject: true,
                    description: true,
                    metadata: true,
                    createdAt: true,
                    staff: {
                        select: { id: true, name: true },
                    },
                },
            },
            tickets: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    subject: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            customerNotes: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    note: true,
                    createdAt: true,
                    createdBy: { select: { name: true } },
                },
            },
            segmentMemberships: {
                select: {
                    segment: { select: { id: true, name: true, color: true } },
                },
            },
            tagAssignments: {
                select: {
                    tag: { select: { id: true, name: true, color: true } },
                },
            },
            _count: {
                select: { orders: true, tickets: true },
            },
        },
    })

    if (!customer) {
        notFound()
    }

    // Aggregate spend
    const spendAgg = await prisma.order.aggregate({
        where: { userId: id, paymentStatus: "PAID" },
        _sum: { total: true },
        _avg: { total: true },
    })

    // All available segments and tags for assignment dropdowns
    const [allSegments, allTags] = await Promise.all([
        prisma.customerSegment.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, color: true },
        }),
        prisma.customerTag.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, color: true },
        }),
    ])

    // Serialize dates to strings for client component
    const serialized = JSON.parse(JSON.stringify({
        ...customer,
        segments: customer.segmentMemberships.map((m) => m.segment),
        tags: customer.tagAssignments.map((a) => a.tag),
        totalSpent: spendAgg._sum.total || 0,
        averageOrderValue: spendAgg._avg.total || 0,
    }))

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Back navigation */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/admin/customers"
                    className="p-2 hover:bg-obsidian-100 rounded-sm transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Back to customer list"
                >
                    <ChevronLeft className="w-5 h-5 text-obsidian-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        {customer.name}
                    </h1>
                    <p className="text-sm text-obsidian-500">{customer.email}</p>
                </div>
            </div>

            <Customer360Client
                customer={serialized}
                allSegments={JSON.parse(JSON.stringify(allSegments))}
                allTags={JSON.parse(JSON.stringify(allTags))}
            />
        </div>
    )
}
