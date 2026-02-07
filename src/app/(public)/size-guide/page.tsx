import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "size-guide"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Size Guide | FBG" }
}

export default function SizeGuidePage() {
    return <ContentPage slug={SLUG} />
}
