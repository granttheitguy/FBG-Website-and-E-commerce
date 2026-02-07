import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"
import Link from "next/link"

function sanitizeHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
        .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/javascript\s*:/gi, "")
}

interface ContentPageProps {
    slug: string
}

export default async function ContentPage({ slug }: ContentPageProps) {
    const page = await prisma.pageContent.findUnique({
        where: { slug },
    })

    if (!page || !page.isPublished) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main id="main-content">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-obsidian-500 mb-8">
                        <Link href="/" className="hover:text-obsidian-900 transition-colors">Home</Link>
                        <span className="text-obsidian-400" aria-hidden="true">/</span>
                        <span className="text-obsidian-900">{page.title}</span>
                    </nav>

                    {/* Page Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-obsidian-900 mb-4">
                            {page.title}
                        </h1>
                        <span className="brand-accent-line mx-auto"></span>
                    </div>

                    {/* Page Content */}
                    <article
                        className="cms-content prose prose-obsidian max-w-none text-obsidian-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
                    />
                </div>
            </main>

            <Footer />
        </div>
    )
}

/**
 * Fetches page metadata from the database for use in generateMetadata.
 * Returns null if page not found.
 */
export async function getPageMetadata(slug: string) {
    const page = await prisma.pageContent.findUnique({
        where: { slug },
        select: {
            title: true,
            metaTitle: true,
            metaDescription: true,
        },
    })

    if (!page) return null

    return {
        title: page.metaTitle || page.title,
        description: page.metaDescription || undefined,
    }
}
