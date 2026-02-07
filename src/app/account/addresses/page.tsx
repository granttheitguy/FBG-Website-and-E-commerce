import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AddressesClient from "./AddressesClient"
import type { Address } from "./AddressesClient"

export default async function AddressesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    let addresses: Address[] = []

    try {
        const rawAddresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" }
            ],
            select: {
                id: true,
                label: true,
                firstName: true,
                lastName: true,
                address1: true,
                address2: true,
                city: true,
                state: true,
                postalCode: true,
                phone: true,
                isDefault: true,
            }
        })

        addresses = rawAddresses
    } catch (error) {
        console.error("Failed to fetch addresses:", error)
        // Return empty array so the page still renders with the empty state
    }

    return (
        <div className="bg-white border border-obsidian-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-obsidian-100 bg-obsidian-50">
                <h1 className="text-lg font-medium text-obsidian-900">Delivery Addresses</h1>
                <p className="text-sm text-obsidian-500">Manage your saved shipping addresses.</p>
            </div>

            <div className="p-6">
                <AddressesClient initialAddresses={addresses} />
            </div>
        </div>
    )
}
