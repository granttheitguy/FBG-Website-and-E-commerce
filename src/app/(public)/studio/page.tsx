import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "studio"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "The Studio | FBG" }
}

export default function StudioPage() {
    return <ContentPage slug={SLUG} />
}
