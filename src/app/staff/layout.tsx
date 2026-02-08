import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { StaffLayoutClient } from "@/components/features/staff/staff-layout"

export default async function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check if this is the login page - skip auth wrapper
    const headersList = await headers()
    const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || ""
    const isLoginPage = pathname.includes("/staff/login")

    let session
    try {
        session = await auth()
    } catch {
        if (isLoginPage) return <>{children}</>
        redirect("/staff/login")
    }

    // For login page, render children without the layout wrapper
    if (!session?.user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        if (isLoginPage) {
            return <>{children}</>
        }
        redirect("/staff/login")
    }

    async function handleSignOut() {
        "use server"
        await signOut({ redirectTo: "/" })
    }

    return (
        <StaffLayoutClient userName={session.user.name ?? "Staff"} signOutAction={handleSignOut}>
            {children}
        </StaffLayoutClient>
    )
}
