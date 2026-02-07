import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { encrypt } from "@/lib/encryption"
import { logActivity } from "@/lib/logger"

export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const host = formData.get("host") as string
        const port = parseInt(formData.get("port") as string)
        const encryption = formData.get("encryption") as string
        const username = formData.get("username") as string
        const password = formData.get("password") as string
        const fromName = formData.get("fromName") as string
        const fromEmail = formData.get("fromEmail") as string

        // Check if settings exist
        const existingSettings = await prisma.smtpSettings.findFirst()

        const data: any = {
            host,
            port,
            encryption,
            username,
            fromName,
            fromEmail,
        }

        // Only update password if provided
        if (password) {
            data.passwordEncrypted = encrypt(password)
        }

        if (existingSettings) {
            await prisma.smtpSettings.update({
                where: { id: existingSettings.id },
                data
            })
        } else {
            if (!password) {
                return NextResponse.json({ error: "Password is required for initial setup" }, { status: 400 })
            }
            data.passwordEncrypted = encrypt(password)
            await prisma.smtpSettings.create({ data })
        }

        await logActivity(session.user.id, "UPDATE_SMTP", "SYSTEM", "SMTP_SETTINGS")

        // Redirect back
        return NextResponse.redirect(new URL("/super-admin/settings/smtp", req.url))
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
