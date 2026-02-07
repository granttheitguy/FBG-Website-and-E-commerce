import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AdminLayoutClient } from "@/components/features/admin/admin-layout"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const headersList = await headers()
    const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || ""
    const isLoginPage = pathname.includes("/admin/login")

    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        if (isLoginPage) {
            return <>{children}</>
        }
        redirect("/admin/login")
    }

    async function handleSignOut() {
        "use server"
        await signOut({ redirectTo: "/" })
    }

    return (
        <AdminLayoutClient userName={session.user.name ?? "Admin"} signOutAction={handleSignOut}>
            {children}
        </AdminLayoutClient>
    )
}
