'use server'

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { pageContentSchema } from "@/lib/validation-schemas"
import { z } from "zod"

export async function createPage(data: z.infer<typeof pageContentSchema>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = pageContentSchema.safeParse(data)
    if (!result.success) {
        const firstError = result.error.issues[0]
        return { error: firstError?.message ?? "Invalid input" }
    }

    const { slug, title, content, metaTitle, metaDescription, isPublished } = result.data

    try {
        const existing = await prisma.pageContent.findUnique({
            where: { slug },
        })

        if (existing) {
            return { error: "A page with this slug already exists" }
        }

        const page = await prisma.pageContent.create({
            data: {
                slug,
                title,
                content,
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                isPublished,
            },
        })

        revalidatePath("/admin/pages")
        revalidatePath(`/${slug}`)
        return { success: true, pageId: page.id }
    } catch (error) {
        console.error("Failed to create page:", error)
        return { error: "Failed to create page" }
    }
}

export async function updatePage(pageId: string, data: z.infer<typeof pageContentSchema>) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = pageContentSchema.safeParse(data)
    if (!result.success) {
        const firstError = result.error.issues[0]
        return { error: firstError?.message ?? "Invalid input" }
    }

    const { slug, title, content, metaTitle, metaDescription, isPublished } = result.data

    try {
        // Check if slug is taken by a different page
        const existing = await prisma.pageContent.findUnique({
            where: { slug },
        })

        if (existing && existing.id !== pageId) {
            return { error: "A different page with this slug already exists" }
        }

        await prisma.pageContent.update({
            where: { id: pageId },
            data: {
                slug,
                title,
                content,
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                isPublished,
            },
        })

        revalidatePath("/admin/pages")
        revalidatePath(`/${slug}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update page:", error)
        return { error: "Failed to update page" }
    }
}

export async function deletePage(pageId: string) {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        const page = await prisma.pageContent.findUnique({
            where: { id: pageId },
        })

        if (!page) {
            return { error: "Page not found" }
        }

        await prisma.pageContent.delete({
            where: { id: pageId },
        })

        revalidatePath("/admin/pages")
        revalidatePath(`/${page.slug}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to delete page:", error)
        return { error: "Failed to delete page" }
    }
}
