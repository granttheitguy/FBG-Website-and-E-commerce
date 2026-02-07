import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, subject, bodyHtml, isActive } = body

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: {
                name,
                subject,
                bodyHtml,
                isActive
            }
        })

        await logActivity(session.user.id, "UPDATE_TEMPLATE", "TEMPLATE", template.id, { name })

        return NextResponse.json(template)
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await prisma.emailTemplate.delete({
            where: { id }
        })

        await logActivity(session.user.id, "DELETE_TEMPLATE", "TEMPLATE", id)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
