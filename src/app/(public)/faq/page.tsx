import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "faq"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "FAQs | FBG" }
}

export default function FaqPage() {
    return <ContentPage slug={SLUG} />
}
