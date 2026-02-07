import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Users } from "lucide-react"
import SegmentListClient from "./SegmentListClient"

export default async function AdminSegmentsPage() {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const segments = await prisma.customerSegment.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: { select: { members: true } },
        },
    })

    const serialized = segments.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        color: s.color,
        isAutomatic: s.isAutomatic,
        memberCount: s._count.members,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    }))

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Segments
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Group customers into segments for targeted engagement.
                    </p>
                </div>
            </div>

            <SegmentListClient segments={serialized} canManage={isAdmin} />
        </div>
    )
}
