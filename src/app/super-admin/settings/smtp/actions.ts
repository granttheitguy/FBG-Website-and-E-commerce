'use server'

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { smtpSettingsSchema } from "@/lib/validation-schemas"
import { encrypt } from "@/lib/encryption"
import { sendEmail } from "@/lib/email"
import { z } from "zod"

export async function getSmtpSettings() {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { error: "Unauthorized" }
    }

    try {
        const settings = await prisma.smtpSettings.findFirst()
        if (!settings) return { settings: null }

        // Mask password
        return {
            settings: {
                ...settings,
                password: "••••••••", // Don't send real password to client
            }
        }
    } catch (error) {
        console.error("Failed to fetch SMTP settings:", error)
        return { error: "Failed to fetch settings" }
    }
}

export async function saveSmtpSettings(data: z.infer<typeof smtpSettingsSchema>) {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { error: "Unauthorized" }
    }

    const result = smtpSettingsSchema.safeParse(data)
    if (!result.success) {
        return { error: "Invalid input" }
    }

    try {
        const existingSettings = await prisma.smtpSettings.findFirst()

        // If password is masked, keep existing password
        let passwordEncrypted = existingSettings?.passwordEncrypted
        if (data.password && data.password !== "••••••••") {
            passwordEncrypted = encrypt(data.password)
        }

        if (!passwordEncrypted) {
            return { error: "Password is required" }
        }

        if (existingSettings) {
            await prisma.smtpSettings.update({
                where: { id: existingSettings.id },
                data: {
                    host: data.host,
                    port: data.port,
                    encryption: data.encryption,
                    username: data.username,
                    passwordEncrypted,
                    fromName: data.fromName,
                    fromEmail: data.fromEmail,
                    replyToEmail: data.replyToEmail || null,
                }
            })
        } else {
            await prisma.smtpSettings.create({
                data: {
                    host: data.host,
                    port: data.port,
                    encryption: data.encryption,
                    username: data.username,
                    passwordEncrypted,
                    fromName: data.fromName,
                    fromEmail: data.fromEmail,
                    replyToEmail: data.replyToEmail || null,
                }
            })
        }

        revalidatePath("/super-admin/settings/smtp")
        return { success: true }
    } catch (error) {
        console.error("Failed to save SMTP settings:", error)
        return { error: "Failed to save settings" }
    }
}

export async function testSmtpConnection() {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { error: "Unauthorized" }
    }

    if (!session.user.email) {
        return { error: "User email not found" }
    }

    try {
        await sendEmail(
            session.user.email,
            "SMTP Test Connection",
            `
            <h1>SMTP Test Successful</h1>
            <p>This is a test email from your Fashion by Grant platform.</p>
            <p>If you are reading this, your SMTP settings are configured correctly.</p>
            <p>Time: ${new Date().toLocaleString()}</p>
            `
        )
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Failed to send test email" }
    }
}
