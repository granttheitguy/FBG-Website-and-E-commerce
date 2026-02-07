import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logActivity } from "@/lib/logger"

export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, subject, bodyHtml, isActive } = body

        if (!name || !subject || !bodyHtml) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Check uniqueness
        const existing = await prisma.emailTemplate.findUnique({
            where: { name }
        })

        if (existing) {
            return NextResponse.json({ error: "Template with this name already exists" }, { status: 400 })
        }

        const template = await prisma.emailTemplate.create({
            data: {
                name,
                subject,
                bodyHtml,
                isActive
            }
        })

        await logActivity(session.user.id, "CREATE_TEMPLATE", "TEMPLATE", template.id, { name })

        return NextResponse.json(template)
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
