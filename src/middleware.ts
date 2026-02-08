import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const session = req.auth
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
        "/",
        "/shop",
        "/product",
        "/contact",
        "/about",
        "/faq",
        "/size-guide",
        "/delivery",
        "/terms",
        "/bespoke",
        "/studio",
        "/alterations",
        "/fabric-sourcing",
        "/group-orders",
        "/checkout",
    ]
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Auth routes - role-specific
    const authRoutes = {
        customer: ["/login", "/signup"],
        superAdmin: ["/super-admin/login"],
        admin: ["/admin/login"],
        staff: ["/staff/login"]
    }

    const isCustomerAuthRoute = authRoutes.customer.some(route => pathname.startsWith(route))
    const isSuperAdminAuthRoute = authRoutes.superAdmin.some(route => pathname.startsWith(route))
    const isAdminAuthRoute = authRoutes.admin.some(route => pathname.startsWith(route))
    const isStaffAuthRoute = authRoutes.staff.some(route => pathname.startsWith(route))
    const isAnyAuthRoute = isCustomerAuthRoute || isSuperAdminAuthRoute || isAdminAuthRoute || isStaffAuthRoute

    // If user is logged in and trying to access auth pages, redirect to appropriate dashboard
    if (session && isAnyAuthRoute) {
        return NextResponse.redirect(new URL(getDashboardUrl(session.user.role), req.url))
    }

    // If not logged in and trying to access protected route, redirect to appropriate login page
    if (!session && !isPublicRoute && !isAnyAuthRoute) {
        if (pathname.startsWith("/super-admin")) {
            return NextResponse.redirect(new URL("/super-admin/login", req.url))
        }
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/admin/login", req.url))
        }
        if (pathname.startsWith("/staff")) {
            return NextResponse.redirect(new URL("/staff/login", req.url))
        }
        if (pathname.startsWith("/account")) {
            return NextResponse.redirect(new URL("/login", req.url))
        }
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Role-based access control
    if (session && !isPublicRoute && !isAnyAuthRoute) {
        const userRole = session.user.role

        if (pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(getDashboardUrl(userRole), req.url))
        }

        if (pathname.startsWith("/admin") && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
            return NextResponse.redirect(new URL(getDashboardUrl(userRole), req.url))
        }

        if (pathname.startsWith("/staff") && !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
            return NextResponse.redirect(new URL(getDashboardUrl(userRole), req.url))
        }

        if (pathname.startsWith("/account") && userRole !== "CUSTOMER") {
            return NextResponse.redirect(new URL(getDashboardUrl(userRole), req.url))
        }
    }

    // Set pathname header for server components (must be on request, not response)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-next-pathname", pathname)
    return NextResponse.next({
        request: { headers: requestHeaders },
    })
})

function getDashboardUrl(role: string): string {
    switch (role) {
        case "SUPER_ADMIN":
            return "/super-admin/dashboard"
        case "ADMIN":
            return "/admin/dashboard"
        case "STAFF":
            return "/staff/dashboard"
        case "CUSTOMER":
            return "/account/dashboard"
        default:
            return "/"
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/auth (auth endpoints)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
