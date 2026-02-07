import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "terms"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Terms & Conditions | FBG" }
}

export default function TermsPage() {
    return <ContentPage slug={SLUG} />
}
