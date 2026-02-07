import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PageForm from "../_components/PageForm"

export default async function NewPagePage() {
    const session = await auth()

    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        redirect("/admin/login")
    }

    return <PageForm />
}
