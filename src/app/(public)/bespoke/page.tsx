import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "bespoke"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Bespoke Fitting | FBG" }
}

export default function BespokePage() {
    return <ContentPage slug={SLUG} />
}
