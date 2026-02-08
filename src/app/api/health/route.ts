import { NextResponse } from "next/server"

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
  }

  // 1. Check environment variables (existence only, never log values)
  results.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
  }

  // 2. Test Prisma DB connection
  try {
    const { prisma } = await import("@/lib/db")
    await prisma.$queryRaw`SELECT 1`
    results.prisma = "ok"
  } catch (e) {
    results.prisma = { error: e instanceof Error ? e.message : String(e) }
  }

  // 3. Test bcryptjs import
  try {
    await import("bcryptjs")
    results.bcryptjs = "ok"
  } catch (e) {
    results.bcryptjs = { error: e instanceof Error ? e.message : String(e) }
  }

  // 4. Test NextAuth config import
  try {
    const { authConfig } = await import("@/lib/auth.config")
    results.authConfig = {
      ok: true,
      hasSecret: !!authConfig.secret,
      sessionStrategy: authConfig.session?.strategy,
    }
  } catch (e) {
    results.authConfig = { error: e instanceof Error ? e.message : String(e) }
  }

  // 5. Test full NextAuth initialization
  try {
    await import("@/lib/auth")
    results.nextauth = "ok"
  } catch (e) {
    results.nextauth = {
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined,
    }
  }

  const allOk =
    results.prisma === "ok" &&
    results.bcryptjs === "ok" &&
    results.nextauth === "ok"

  return NextResponse.json(results, { status: allOk ? 200 : 500 })
}
