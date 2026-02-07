import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import BespokeOrderDetailClient from "./BespokeOrderDetailClient"
import type { BespokeOrderDetail, StaffMember, ProductionTaskStatus, BespokeOrderStatus } from "@/types/erp"

export default async function BespokeOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    const { id } = await params

    const [order, staffMembers] = await Promise.all([
        prisma.bespokeOrder.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                measurement: {
                    select: {
                        id: true,
                        label: true,
                        chest: true,
                        shoulder: true,
                        sleeveLength: true,
                        neck: true,
                        backLength: true,
                        waist: true,
                        hip: true,
                        inseam: true,
                        outseam: true,
                        thigh: true,
                        height: true,
                        weight: true,
                    },
                },
                tasks: {
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                    include: {
                        assignedTo: { select: { id: true, name: true } },
                    },
                },
                statusLogs: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        changedBy: { select: { id: true, name: true } },
                    },
                },
            },
        }),
        prisma.user.findMany({
            where: {
                role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
                status: "ACTIVE",
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
        }),
    ])

    if (!order) {
        notFound()
    }

    // Serialize for client component
    const serializedOrder: BespokeOrderDetail = {
        ...order,
        status: order.status as BespokeOrderStatus,
        fabricDetails: order.fabricDetails as Record<string, unknown> | null,
        designImages: order.designImages as string[] | null,
        referenceImages: order.referenceImages as string[] | null,
        estimatedCompletionDate: order.estimatedCompletionDate?.toISOString() ?? null,
        actualCompletionDate: order.actualCompletionDate?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        tasks: order.tasks.map((t) => ({
            ...t,
            status: t.status as ProductionTaskStatus,
            dueDate: t.dueDate?.toISOString() ?? null,
            completedAt: t.completedAt?.toISOString() ?? null,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        })),
        statusLogs: order.statusLogs.map((log) => ({
            ...log,
            createdAt: log.createdAt.toISOString(),
        })),
    }

    const serializedStaff: StaffMember[] = staffMembers.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
    }))

    return (
        <BespokeOrderDetailClient
            order={serializedOrder}
            staff={serializedStaff}
            currentUserRole={session.user.role}
        />
    )
}
