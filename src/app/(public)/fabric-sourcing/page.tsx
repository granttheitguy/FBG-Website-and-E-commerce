import type { Metadata } from "next"
import ContentPage, { getPageMetadata } from "@/components/features/cms/ContentPage"

const SLUG = "fabric-sourcing"

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getPageMetadata(SLUG)
    return meta ?? { title: "Fabric Sourcing | FBG" }
}

export default function FabricSourcingPage() {
    return <ContentPage slug={SLUG} />
}
