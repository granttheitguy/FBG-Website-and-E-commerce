import { requireRole } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    // Build date filter
    const dateFilter: any = {}
    if (startDateParam) {
        dateFilter.gte = new Date(startDateParam)
    }
    if (endDateParam) {
        const endDate = new Date(endDateParam)
        endDate.setHours(23, 59, 59, 999) // End of day
        dateFilter.lte = endDate
    }

    const whereClause = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}

    // Fetch orders with user info
    const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            items: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    // Generate CSV
    const csvHeaders = [
        "Order Number",
        "Date",
        "Customer Name",
        "Customer Email",
        "Status",
        "Payment Status",
        "Items Count",
        "Total (NGN)",
    ].join(",")

    function sanitizeCsvValue(value: string): string {
        // Escape double quotes by doubling them
        let escaped = value.replace(/"/g, '""')
        // Prevent CSV formula injection
        if (/^[=+\-@\t]/.test(escaped)) {
            escaped = "'" + escaped
        }
        return `"${escaped}"`
    }

    const csvRows = orders.map((order) => {
        const customerName = order.user?.name || "Guest"
        const customerEmail = order.user?.email || order.customerEmail || "N/A"
        const date = new Date(order.createdAt).toLocaleDateString("en-NG")

        return [
            sanitizeCsvValue(order.orderNumber),
            sanitizeCsvValue(date),
            sanitizeCsvValue(customerName),
            sanitizeCsvValue(customerEmail),
            sanitizeCsvValue(order.status),
            sanitizeCsvValue(order.paymentStatus),
            order.items.length,
            order.total.toFixed(2),
        ].join(",")
    })

    const csv = [csvHeaders, ...csvRows].join("\n")

    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="orders-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
    })
}
