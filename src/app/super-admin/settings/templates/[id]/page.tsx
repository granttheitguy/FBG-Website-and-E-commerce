import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import TemplateForm from "@/components/features/admin/TemplateForm"

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        redirect("/admin/dashboard")
    }

    const template = await prisma.emailTemplate.findUnique({
        where: { id }
    })

    if (!template) {
        notFound()
    }

    return (
        <div className="p-8">
            <TemplateForm template={template} />
        </div>
    )
}
