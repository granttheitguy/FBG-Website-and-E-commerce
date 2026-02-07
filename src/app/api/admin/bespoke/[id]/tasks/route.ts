import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { productionTaskSchema } from "@/lib/validation-schemas"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params

        const order = await prisma.bespokeOrder.findUnique({ where: { id } })
        if (!order) {
            return NextResponse.json({ error: "Bespoke order not found" }, { status: 404 })
        }

        const tasks = await prisma.productionTask.findMany({
            where: { bespokeOrderId: id },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
                assignedTo: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json(
            tasks.map((t) => ({
                ...t,
                dueDate: t.dueDate?.toISOString() ?? null,
                completedAt: t.completedAt?.toISOString() ?? null,
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString(),
            }))
        )
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"])
    if (error) return error

    try {
        const { id } = await params
        const body = await req.json()

        // Override bespokeOrderId with the URL param
        const input = { ...body, bespokeOrderId: id }

        const result = productionTaskSchema.safeParse(input)
        if (!result.success) {
            return NextResponse.json(
                { error: "Validation failed", details: result.error.flatten().fieldErrors },
                { status: 422 }
            )
        }

        const order = await prisma.bespokeOrder.findUnique({ where: { id } })
        if (!order) {
            return NextResponse.json({ error: "Bespoke order not found" }, { status: 404 })
        }

        const data = result.data

        // Get the max sortOrder for this order
        const maxSort = await prisma.productionTask.aggregate({
            where: { bespokeOrderId: id },
            _max: { sortOrder: true },
        })

        const task = await prisma.productionTask.create({
            data: {
                bespokeOrderId: id,
                title: data.title,
                description: data.description || null,
                stage: data.stage,
                status: "NOT_STARTED",
                assignedToId: data.assignedToId || null,
                priority: data.priority ?? 0,
                sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
                estimatedHours: data.estimatedHours ?? null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                notes: data.notes || null,
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
            },
        })

        await logActivity(
            session!.user.id,
            "CREATE_PRODUCTION_TASK",
            "PRODUCTION_TASK",
            task.id,
            { title: task.title, bespokeOrderId: id, orderNumber: order.orderNumber }
        )

        return NextResponse.json(
            {
                ...task,
                dueDate: task.dueDate?.toISOString() ?? null,
                completedAt: task.completedAt?.toISOString() ?? null,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
            },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
