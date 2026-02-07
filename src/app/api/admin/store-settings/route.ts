import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { storeSettingsSchema } from "@/lib/validation-schemas"

export async function GET() {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        let settings = await prisma.storeSettings.findFirst()

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: {
                    storeName: "Fashion By Grant",
                    currency: "NGN",
                },
            })
        }

        const { paystackSecretKeyEnc, ...safeSettings } = settings
        return NextResponse.json({ ...safeSettings, hasPaystackSecretKey: !!paystackSecretKeyEnc })
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        )
    }
}

export async function PATCH(req: Request) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const body = await req.json()

        // Validate input
        const result = storeSettingsSchema.safeParse(body)
        if (!result.success) {
            const firstError = result.error.issues[0]
            return NextResponse.json(
                { error: firstError?.message ?? "Invalid input" },
                { status: 400 }
            )
        }

        // Get or create settings record
        let settings = await prisma.storeSettings.findFirst()

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: {
                    storeName: "Fashion By Grant",
                    currency: "NGN",
                },
            })
        }

        // Prepare update data
        const updateData: any = {
            storeName: result.data.storeName,
            storeEmail: result.data.storeEmail || null,
            storePhone: result.data.storePhone || null,
            storeAddress: result.data.storeAddress || null,
            currency: result.data.currency,
            paystackPublicKey: result.data.paystackPublicKey || null,
            // Only update secret key if provided (new value)
            paystackSecretKeyEnc: result.data.paystackSecretKey || settings.paystackSecretKeyEnc,
            whatsappNumber: result.data.whatsappNumber || null,
            socialLinks: result.data.socialLinks || null,
            freeShippingThreshold: result.data.freeShippingThreshold || null,
            logoUrl: result.data.logoUrl || null,
            faviconUrl: result.data.faviconUrl || null,
        }

        // Update settings
        const updatedSettings = await prisma.storeSettings.update({
            where: { id: settings.id },
            data: updateData,
        })

        // Log activity
        await logActivity(
            session!.user.id,
            "UPDATE_STORE_SETTINGS",
            "StoreSettings",
            updatedSettings.id,
            { updatedFields: Object.keys(result.data) }
        )

        const { paystackSecretKeyEnc: _secret, ...safeUpdated } = updatedSettings
        return NextResponse.json({
            message: "Settings updated successfully",
            settings: { ...safeUpdated, hasPaystackSecretKey: !!_secret },
        })
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        )
    }
}
