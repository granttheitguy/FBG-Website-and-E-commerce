import { NextResponse } from "next/server"

interface RateLimitStore {
    [key: string]: {
        count: number
        resetTime: number
    }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key]
        }
    })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
    interval: number // in milliseconds
    maxRequests: number
}

export const rateLimitConfigs = {
    auth: { interval: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
    api: { interval: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
    order: { interval: 60 * 60 * 1000, maxRequests: 10 }, // 10 requests per hour
}

export async function rateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now()
    const key = identifier

    if (!store[key] || store[key].resetTime < now) {
        store[key] = {
            count: 1,
            resetTime: now + config.interval
        }
        return {
            success: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            reset: store[key].resetTime
        }
    }

    store[key].count++

    const remaining = Math.max(0, config.maxRequests - store[key].count)
    const success = store[key].count <= config.maxRequests

    return {
        success,
        limit: config.maxRequests,
        remaining,
        reset: store[key].resetTime
    }
}

export function rateLimitResponse(result: { success: boolean; limit: number; remaining: number; reset: number }) {
    if (!result.success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": result.limit.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
                    "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString()
                }
            }
        )
    }
    return null
}

export function getClientIdentifier(req: Request): string {
    // Try to get IP from headers (for production behind proxy)
    const forwarded = req.headers.get("x-forwarded-for")
    const realIp = req.headers.get("x-real-ip")

    return forwarded?.split(",")[0] || realIp || "unknown"
}
