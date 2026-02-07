import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProfileForm from "@/components/features/account/ProfileForm"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true }
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="bg-white border border-obsidian-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-obsidian-100 bg-obsidian-50">
                <h1 className="text-lg font-medium text-obsidian-900">My Profile</h1>
                <p className="text-sm text-obsidian-500">Manage your personal information and shipping address.</p>
            </div>

            <div className="p-6">
                <ProfileForm user={user} />
            </div>
        </div>
    )
}
