import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSmtpSettings } from "./actions"
import { SmtpSettingsForm } from "./_components/smtp-settings-form"

export default async function SmtpSettingsPage() {
    const session = await auth()

    if (session?.user?.role !== "SUPER_ADMIN") {
        redirect("/admin/dashboard")
    }

    const { settings } = await getSmtpSettings()

    return (
        <div className="p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-obsidian-900">SMTP Settings</h1>
                <p className="text-sm text-obsidian-500 mt-1">Configure the email server settings for system notifications.</p>
            </div>

            <div className="bg-white p-6 rounded-sm border border-obsidian-200 shadow-sm">
                <SmtpSettingsForm initialSettings={settings as any} />
            </div>
        </div>
    )
}
