import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"

export default async function AdminSettingsPage() {
    const session = await auth()

    // Only Super Admin and Admin can access settings
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    // Fetch current settings
    let settings = await prisma.storeSettings.findFirst()

    // Create default if none exist
    if (!settings) {
        settings = await prisma.storeSettings.create({
            data: {
                storeName: "Fashion By Grant",
                currency: "NGN",
            },
        })
    }

    const { paystackSecretKeyEnc, ...safeSettings } = settings

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-obsidian-900">Store Settings</h1>
                <p className="text-sm text-obsidian-500 mt-1">Manage your store configuration and preferences.</p>
            </div>

            <SettingsClient initialSettings={{ ...safeSettings, hasPaystackSecretKey: !!paystackSecretKeyEnc }} />
        </div>
    )
}
