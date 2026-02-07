import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "alterations"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Alterations | FBG" }
}

export default function AlterationsPage() {
    return <ContentPage slug={SLUG} />
}
