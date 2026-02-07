import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import PageForm from "../../_components/PageForm"

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    const { id } = await params

    const page = await prisma.pageContent.findUnique({
        where: { id },
    })

    if (!page) {
        notFound()
    }

    return <PageForm page={page} />
}
