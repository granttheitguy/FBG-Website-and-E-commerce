import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "group-orders"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Group Orders | FBG" }
}

export default function GroupOrdersPage() {
    return <ContentPage slug={SLUG} />
}
