import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { categorySchema } from "@/lib/validation-schemas"

// GET /api/admin/categories - List all categories
export async function GET() {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                parent: {
                    select: { id: true, name: true }
                },
                children: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: categories
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch categories" },
            { status: 500 }
        )
    }
}

// POST /api/admin/categories - Create category
export async function POST(request: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

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

        // Check slug uniqueness
        const existingCategory = await prisma.category.findUnique({
            where: { slug }
        })

        if (existingCategory) {
            return NextResponse.json(
                { success: false, error: "A category with this slug already exists" },
                { status: 409 }
            )
        }

        // If parentId is provided, verify it exists
        if (parentId) {
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId }
            })

            if (!parentCategory) {
                return NextResponse.json(
                    { success: false, error: "Parent category not found" },
                    { status: 404 }
                )
            }
        }

        const category = await prisma.category.create({
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
            "CREATE_CATEGORY",
            "Category",
            category.id,
            { name: category.name, slug: category.slug }
        )

        return NextResponse.json(
            {
                success: true,
                message: "Category created successfully",
                data: category
            },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to create category" },
            { status: 500 }
        )
    }
}
