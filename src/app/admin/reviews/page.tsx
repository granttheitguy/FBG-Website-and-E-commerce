import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ReviewsClient from "./ReviewsClient"

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED"

export default async function AdminReviewsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const resolvedParams = await searchParams
    const statusFilter = resolvedParams.status as ReviewStatus | undefined

    const where: Record<string, unknown> = {}
    if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
        where.status = statusFilter
    }

    const reviews = await prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            product: {
                select: { id: true, name: true, slug: true },
            },
            user: {
                select: { id: true, name: true, email: true },
            },
        },
    })

    // Count reviews by status for summary
    const counts = await prisma.review.groupBy({
        by: ["status"],
        _count: { id: true },
    })

    const pendingCount = counts.find((c) => c.status === "PENDING")?._count.id ?? 0
    const approvedCount = counts.find((c) => c.status === "APPROVED")?._count.id ?? 0
    const rejectedCount = counts.find((c) => c.status === "REJECTED")?._count.id ?? 0
    const totalCount = pendingCount + approvedCount + rejectedCount

    // Serialize dates to strings for client component
    const serializedReviews = reviews.map((r) => ({
        ...r,
        status: r.status as "PENDING" | "APPROVED" | "REJECTED",
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }))

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-medium text-obsidian-900">Reviews</h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Moderate customer reviews.{" "}
                        <span className="font-medium">{totalCount}</span> total,{" "}
                        <span className="text-yellow-700 font-medium">{pendingCount} pending</span>
                    </p>
                </div>
            </div>

            <ReviewsClient
                reviews={serializedReviews}
                currentStatus={statusFilter}
            />
        </div>
    )
}
