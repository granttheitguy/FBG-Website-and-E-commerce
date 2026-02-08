import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    // Diagnostic: verify route handler is being reached
    if (req.nextUrl.searchParams.has("debug")) {
        return NextResponse.json({
            reached: true,
            url: req.url,
            nextUrl: req.nextUrl.toString(),
            pathname: req.nextUrl.pathname,
        })
    }

    try {
        return await handlers.GET(req)
    } catch (e) {
        console.error("[NextAuth GET Error]", e)
        return NextResponse.json(
            {
                error: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8) : undefined,
            },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        return await handlers.POST(req)
    } catch (e) {
        console.error("[NextAuth POST Error]", e)
        return NextResponse.json(
            {
                error: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8) : undefined,
            },
            { status: 500 }
        )
    }
}
