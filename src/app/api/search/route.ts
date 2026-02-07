import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { searchSchema } from "@/lib/validation-schemas"
import { rateLimit, rateLimitConfigs, rateLimitResponse, getClientIdentifier } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(`search:${clientId}`, rateLimitConfigs.api)
    const rateLimitError = rateLimitResponse(rateLimitResult)
    if (rateLimitError) return rateLimitError

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const parsed = searchSchema.safeParse({
        q: searchParams.get("q") ?? "",
        limit: searchParams.get("limit") ?? "10",
    })

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid search parameters", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const { q, limit } = parsed.data
    const query = q.trim()

    if (!query) {
        return NextResponse.json({ products: [], total: 0 })
    }

    try {
        // SQLite uses LIKE for case-insensitive search (LIKE is case-insensitive by default for ASCII in SQLite)
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: {
                    status: "ACTIVE",
                    OR: [
                        { name: { contains: query } },
                        { descriptionShort: { contains: query } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    basePrice: true,
                    images: {
                        orderBy: { sortOrder: "asc" },
                        take: 1,
                        select: { imageUrl: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            }),
            prisma.product.count({
                where: {
                    status: "ACTIVE",
                    OR: [
                        { name: { contains: query } },
                        { descriptionShort: { contains: query } },
                    ],
                },
            }),
        ])

        return NextResponse.json(
            { products, total },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                },
            }
        )
    } catch {
        return NextResponse.json(
            { error: "Failed to search products" },
            { status: 500 }
        )
    }
}
