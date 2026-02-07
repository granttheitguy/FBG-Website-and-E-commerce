import nodemailer from "nodemailer"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
        // 1. Get Settings
        const settings = await prisma.smtpSettings.findFirst({
            where: { isActive: true }
        })

        if (!settings) {
            throw new Error("SMTP settings not configured")
        }

        // 2. Create Transporter
        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.encryption === "ssl", // true for 465, false for other ports
            auth: {
                user: settings.username,
                pass: decrypt(settings.passwordEncrypted),
            },
        })

        // 3. Send Email
        const info = await transporter.sendMail({
            from: `"${settings.fromName}" <${settings.fromEmail}>`,
            to,
            subject,
            text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback text
            html,
        })

        // 4. Log Success
        await prisma.emailLog.create({
            data: {
                toEmail: to,
                templateName: "CUSTOM", // or pass as arg
                subject,
                status: "SENT",
                payload: JSON.stringify({ messageId: info.messageId }),
            }
        })

        return { success: true, messageId: info.messageId }
    } catch (error: any) {
        console.error("Email sending failed:", error)

        // 4. Log Failure
        await prisma.emailLog.create({
            data: {
                toEmail: to,
                templateName: "CUSTOM",
                subject,
                status: "FAILED",
                errorMessage: error.message,
            }
        })

        throw error
    }
}
