import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(req: Request) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
  }

  // 1. Check environment variables
  results.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL || false,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || false,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || false,
    DATABASE_URL: !!process.env.DATABASE_URL,
  }

  // 2. Test Prisma
  try {
    const { prisma } = await import("@/lib/db")
    await prisma.$queryRaw`SELECT 1`
    results.prisma = "ok"
  } catch (e) {
    results.prisma = { error: e instanceof Error ? e.message : String(e) }
  }

  // 3. Test auth config — verify trustHost is set
  try {
    const { authConfig } = await import("@/lib/auth.config")
    results.authConfig = {
      hasSecret: !!authConfig.secret,
      trustHost: (authConfig as Record<string, unknown>).trustHost,
      sessionStrategy: authConfig.session?.strategy,
    }
  } catch (e) {
    results.authConfig = { error: e instanceof Error ? e.message : String(e) }
  }

  // 4. Test auth() session call
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()
    results.authCall = { ok: true, hasSession: !!session }
  } catch (e) {
    results.authCall = {
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined,
    }
  }

  // 5. Directly test the NextAuth handler with a providers request
  try {
    const { handlers } = await import("@/lib/auth")
    const url = new URL("/api/auth/providers", req.url)
    const testReq = new NextRequest(url.toString(), { method: "GET" })
    const response = await handlers.GET(testReq)
    const body = await response.text()
    results.handlersTest = {
      status: response.status,
      body: response.status === 200 ? JSON.parse(body) : body.slice(0, 500),
    }
  } catch (e) {
    results.handlersTest = {
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8) : undefined,
    }
  }

  // 6. Check middleware header propagation
  try {
    const headersList = await headers()
    results.headers = {
      "x-next-pathname": headersList.get("x-next-pathname") || "(missing)",
    }
  } catch (e) {
    results.headers = { error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json(results, { status: 200 })
}
