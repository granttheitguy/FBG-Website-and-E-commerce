import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import BespokeOrderForm from "@/components/features/admin/BespokeOrderForm"

export default async function NewBespokeOrderPage() {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
        redirect("/admin/dashboard")
    }

    return (
        <div className="p-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    New Bespoke Order
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    Create a new custom garment order for a customer.
                </p>
            </div>

            <div className="bg-white rounded-sm border border-obsidian-200 shadow-sm p-6">
                <BespokeOrderForm mode="create" />
            </div>
        </div>
    )
}
