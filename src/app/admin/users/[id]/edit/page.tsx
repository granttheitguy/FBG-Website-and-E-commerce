import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import EditUserForm from "@/components/features/admin/EditUserForm"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
        }
    })

    if (!user) {
        notFound()
    }

    return <EditUserForm user={user} />
}
