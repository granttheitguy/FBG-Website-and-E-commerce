import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import StaffTasksList from "@/components/features/staff/staff-tasks-list"
import type { ProductionTaskDetail, BespokeOrderStatus } from "@/types/erp"

export default async function StaffTasksPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/staff/login")
    }

    const tasks = await prisma.productionTask.findMany({
        where: {
            assignedToId: session.user.id,
        },
        orderBy: [
            { status: "asc" },
            { priority: "desc" },
            { dueDate: "asc" },
        ],
        include: {
            assignedTo: { select: { id: true, name: true } },
            bespokeOrder: {
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    status: true,
                },
            },
        },
    })

    // Serialize dates for client component
    const serializedTasks: ProductionTaskDetail[] = tasks.map((task) => ({
        id: task.id,
        bespokeOrderId: task.bespokeOrderId,
        title: task.title,
        description: task.description,
        stage: task.stage,
        status: task.status as ProductionTaskDetail["status"],
        priority: task.priority,
        sortOrder: task.sortOrder,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        dueDate: task.dueDate?.toISOString() ?? null,
        completedAt: task.completedAt?.toISOString() ?? null,
        notes: task.notes,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        assignedTo: task.assignedTo,
        bespokeOrder: task.bespokeOrder
            ? {
                  id: task.bespokeOrder.id,
                  orderNumber: task.bespokeOrder.orderNumber,
                  customerName: task.bespokeOrder.customerName,
                  status: task.bespokeOrder.status as BespokeOrderStatus,
              }
            : undefined,
    }))

    // Custom sort: active tasks first (NOT_STARTED, IN_PROGRESS, ON_HOLD), then completed/cancelled
    const activeStatuses = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD"]
    const sortedTasks = serializedTasks.sort((a, b) => {
        const aActive = activeStatuses.includes(a.status) ? 0 : 1
        const bActive = activeStatuses.includes(b.status) ? 0 : 1
        if (aActive !== bActive) return aActive - bActive
        // Within active tasks, sort by priority (highest first), then by due date
        if (aActive === 0 && bActive === 0) {
            if (a.priority !== b.priority) return b.priority - a.priority
            if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            if (a.dueDate && !b.dueDate) return -1
            if (!a.dueDate && b.dueDate) return 1
        }
        return 0
    })

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    My Tasks
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you
                </p>
            </div>

            <StaffTasksList tasks={sortedTasks} />
        </div>
    )
}
