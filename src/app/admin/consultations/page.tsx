import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ConsultationsTable } from "./consultations-table"

export default async function AdminConsultationsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const { status } = await searchParams

    const where: Record<string, unknown> = {}
    if (status && status !== "ALL") {
        where.status = status
    }

    const bookings = await prisma.consultationBooking.findMany({
        where,
        orderBy: { createdAt: "desc" },
    })

    const counts = {
        all: await prisma.consultationBooking.count(),
        pending: await prisma.consultationBooking.count({ where: { status: "PENDING" } }),
        confirmed: await prisma.consultationBooking.count({ where: { status: "CONFIRMED" } }),
        completed: await prisma.consultationBooking.count({ where: { status: "COMPLETED" } }),
        cancelled: await prisma.consultationBooking.count({ where: { status: "CANCELLED" } }),
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                        Consultations
                    </h1>
                    <p className="text-sm text-obsidian-500 mt-1">
                        Manage consultation booking requests from customers.
                    </p>
                </div>
            </div>

            <ConsultationsTable
                bookings={bookings}
                counts={counts}
                currentStatus={status || "ALL"}
            />
        </div>
    )
}
