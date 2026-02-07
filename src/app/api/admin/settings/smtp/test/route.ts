import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        await sendEmail(
            email,
            "Test Email from FBG Platform",
            "<h1>It Works!</h1><p>Your SMTP settings are correctly configured.</p>",
            "It Works! Your SMTP settings are correctly configured."
        )

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to send test email" }, { status: 500 })
    }
}
