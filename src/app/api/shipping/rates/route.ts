import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// ============================================
// GET /api/shipping/rates?state=Lagos
// Public endpoint -- returns shipping rates for a given Nigerian state
// ============================================

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const state = searchParams.get("state")

        if (!state || state.trim().length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "State parameter is required",
                },
                { status: 400 }
            )
        }

        const trimmedState = state.trim()

        // Fetch all active shipping zones
        const zones = await prisma.shippingZone.findMany({
            where: { isActive: true },
            include: {
                rates: {
                    where: { isActive: true },
                    orderBy: { price: "asc" },
                },
            },
        })

        // Find the zone whose states array contains the given state
        const matchingZone = zones.find((zone) => {
            const statesList = JSON.parse(zone.states as string) as string[]
            return statesList.some(
                (s) => s.toLowerCase() === trimmedState.toLowerCase()
            )
        })

        if (!matchingZone) {
            return NextResponse.json({
                success: true,
                message: "No shipping zone found for the specified state",
                data: {
                    zone: null,
                    rates: [],
                },
            })
        }

        return NextResponse.json({
            success: true,
            message: "Shipping rates retrieved",
            data: {
                zone: {
                    id: matchingZone.id,
                    name: matchingZone.name,
                },
                rates: matchingZone.rates.map((rate) => ({
                    id: rate.id,
                    name: rate.name,
                    price: rate.price,
                    estimatedDays: rate.estimatedDays,
                })),
            },
        })
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "An error occurred while fetching shipping rates",
            },
            { status: 500 }
        )
    }
}
