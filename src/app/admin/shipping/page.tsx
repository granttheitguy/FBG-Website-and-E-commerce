import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShippingPageClient } from "./_components/ShippingPageClient"

export default async function AdminShippingPage() {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const zones = await prisma.shippingZone.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            rates: {
                orderBy: { price: "asc" },
            },
        },
    })

    // Serialize for client component
    const serializedZones = zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        states: JSON.parse(zone.states as string) as string[],
        isActive: zone.isActive,
        rates: zone.rates.map((rate) => ({
            id: rate.id,
            shippingZoneId: rate.shippingZoneId,
            name: rate.name,
            price: rate.price,
            estimatedDays: rate.estimatedDays,
            isActive: rate.isActive,
        })),
    }))

    return (
        <div className="p-8">
            <ShippingPageClient zones={serializedZones} />
        </div>
    )
}
