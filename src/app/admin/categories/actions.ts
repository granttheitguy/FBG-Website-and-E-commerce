"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { categorySchema } from "@/lib/validation-schemas"
import { z } from "zod"

export type CategoryFormState = {
    success?: boolean
    error?: string
}

export async function createCategory(
    data: z.infer<typeof categorySchema>
): Promise<CategoryFormState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = categorySchema.safeParse(data)
    if (!result.success) {
        const firstError = result.error.issues[0]
        return { error: firstError?.message ?? "Invalid input" }
    }

    const { name, slug, parentId, description } = result.data

    try {
        // Check for duplicate slug
        const existing = await prisma.category.findUnique({
            where: { slug },
        })

        if (existing) {
            return { error: "A category with this slug already exists" }
        }

        // Validate parentId exists if provided
        if (parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: parentId },
            })
            if (!parent) {
                return { error: "Parent category not found" }
            }
        }

        await prisma.category.create({
            data: {
                name,
                slug,
                parentId: parentId || null,
                description: description || null,
            },
        })

        revalidatePath("/admin/categories")
        return { success: true }
    } catch (error) {
        console.error("Failed to create category:", error)
        return { error: "Failed to create category" }
    }
}

export async function updateCategory(
    categoryId: string,
    data: z.infer<typeof categorySchema>
): Promise<CategoryFormState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    const result = categorySchema.safeParse(data)
    if (!result.success) {
        const firstError = result.error.issues[0]
        return { error: firstError?.message ?? "Invalid input" }
    }

    const { name, slug, parentId, description } = result.data

    try {
        // Check for duplicate slug (excluding the current category)
        const existing = await prisma.category.findFirst({
            where: {
                slug,
                NOT: { id: categoryId },
            },
        })

        if (existing) {
            return { error: "A category with this slug already exists" }
        }

        // Prevent self-parenting
        if (parentId === categoryId) {
            return { error: "A category cannot be its own parent" }
        }

        // Validate parentId exists if provided
        if (parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: parentId },
            })
            if (!parent) {
                return { error: "Parent category not found" }
            }
        }

        await prisma.category.update({
            where: { id: categoryId },
            data: {
                name,
                slug,
                parentId: parentId || null,
                description: description || null,
            },
        })

        revalidatePath("/admin/categories")
        return { success: true }
    } catch (error) {
        console.error("Failed to update category:", error)
        return { error: "Failed to update category" }
    }
}

export async function deleteCategory(categoryId: string): Promise<CategoryFormState> {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return { error: "Unauthorized" }
    }

    try {
        // Check if category has children
        const children = await prisma.category.findFirst({
            where: { parentId: categoryId },
        })

        if (children) {
            return { error: "Cannot delete a category that has subcategories. Remove or reassign them first." }
        }

        // Check if category has products
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: { _count: { select: { products: true } } },
        })

        if (!category) {
            return { error: "Category not found" }
        }

        if (category._count.products > 0) {
            return { error: "Cannot delete a category that has products assigned. Remove products first." }
        }

        await prisma.category.delete({
            where: { id: categoryId },
        })

        revalidatePath("/admin/categories")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete category:", error)
        return { error: "Failed to delete category" }
    }
}
