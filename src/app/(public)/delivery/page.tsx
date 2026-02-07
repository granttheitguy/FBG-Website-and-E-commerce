import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "delivery"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Delivery Information | FBG" }
}

export default function DeliveryPage() {
    return <ContentPage slug={SLUG} />
}
