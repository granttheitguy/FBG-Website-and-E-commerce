import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { categorySchema } from "@/lib/validation-schemas"

// GET /api/admin/categories/[id] - Get single category
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                parent: {
                    select: { id: true, name: true }
                },
                children: {
                    select: { id: true, name: true, slug: true }
                },
                products: {
                    select: { id: true, name: true, slug: true, status: true },
                    take: 10
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!category) {
            return NextResponse.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: category
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch category" },
            { status: 500 }
        )
    }
}

// PATCH /api/admin/categories/[id] - Update category
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const body = await request.json()
        const validation = categorySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    errors: validation.error.issues
                },
                { status: 400 }
            )
        }

        const { name, slug, parentId, description } = validation.data

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        })

        if (!existingCategory) {
            return NextResponse.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            )
        }

        // Check slug uniqueness (excluding current category)
        if (slug !== existingCategory.slug) {
            const slugTaken = await prisma.category.findUnique({
                where: { slug }
            })

            if (slugTaken) {
                return NextResponse.json(
                    { success: false, error: "A category with this slug already exists" },
                    { status: 409 }
                )
            }
        }

        // Prevent setting parent to self
        if (parentId === id) {
            return NextResponse.json(
                { success: false, error: "A category cannot be its own parent" },
                { status: 400 }
            )
        }

        // If parentId is provided, verify it exists and wouldn't create a circular reference
        if (parentId) {
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId },
                include: {
                    parent: true
                }
            })

            if (!parentCategory) {
                return NextResponse.json(
                    { success: false, error: "Parent category not found" },
                    { status: 404 }
                )
            }

            // Check if the proposed parent is a child of this category (would create circular reference)
            if (parentCategory.parentId === id) {
                return NextResponse.json(
                    { success: false, error: "Cannot create circular parent-child relationship" },
                    { status: 400 }
                )
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                parentId: parentId || null,
                description: description || null
            },
            include: {
                parent: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        await logActivity(
            session!.user.id,
            "UPDATE_CATEGORY",
            "Category",
            category.id,
            { name: category.name, slug: category.slug }
        )

        return NextResponse.json({
            success: true,
            message: "Category updated successfully",
            data: category
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to update category" },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                children: true,
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!category) {
            return NextResponse.json(
                { success: false, error: "Category not found" },
                { status: 404 }
            )
        }

        // Prevent deletion if category has products
        if (category._count.products > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Cannot delete category with ${category._count.products} product(s). Remove products first.`
                },
                { status: 400 }
            )
        }

        // Prevent deletion if category has children
        if (category.children.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Cannot delete category with ${category.children.length} sub-category/ies. Remove or reassign sub-categories first.`
                },
                { status: 400 }
            )
        }

        await prisma.category.delete({
            where: { id }
        })

        await logActivity(
            session!.user.id,
            "DELETE_CATEGORY",
            "Category",
            id,
            { name: category.name }
        )

        return NextResponse.json({
            success: true,
            message: "Category deleted successfully"
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to delete category" },
            { status: 500 }
        )
    }
}
