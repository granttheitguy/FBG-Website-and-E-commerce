import { prisma } from "@/lib/db"
import { StoreSettingsForm } from "./store-settings-form"

async function getStoreSettings() {
    const settings = await prisma.storeSettings.findFirst()

    if (!settings) {
        // Create default settings if none exist
        return await prisma.storeSettings.create({
            data: {
                storeName: "Fashion By Grant",
                currency: "NGN",
            }
        })
    }

    return settings
}

export default async function StoreSettingsPage() {
    const settings = await getStoreSettings()

    return (
        <div className="p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-obsidian-900 font-serif">Store Settings</h1>
                <p className="text-obsidian-500 mt-1">Configure your store information and preferences</p>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm">
                <StoreSettingsForm settings={settings} />
            </div>
        </div>
    )
}
