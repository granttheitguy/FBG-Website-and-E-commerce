import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { SuperAdminLayoutClient } from "@/components/features/admin/super-admin-layout"

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const headersList = await headers()
    const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || ""
    const isLoginPage = pathname.includes("/super-admin/login")

    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        if (isLoginPage) {
            return <>{children}</>
        }
        redirect("/super-admin/login")
    }

    async function handleSignOut() {
        "use server"
        await signOut({ redirectTo: "/" })
    }

    return (
        <SuperAdminLayoutClient userName={session.user.name ?? "Super Admin"} signOutAction={handleSignOut}>
            {children}
        </SuperAdminLayoutClient>
    )
}
