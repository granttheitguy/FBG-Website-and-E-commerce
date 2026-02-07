import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { collectionSchema } from "@/lib/validation-schemas"

// GET /api/admin/collections/[id] - Get single collection
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                products: {
                    select: { id: true, name: true, slug: true, status: true },
                    take: 10
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!collection) {
            return NextResponse.json(
                { success: false, error: "Collection not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: collection
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch collection" },
            { status: 500 }
        )
    }
}

// PATCH /api/admin/collections/[id] - Update collection
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const body = await request.json()
        const validation = collectionSchema.safeParse(body)

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

        const { name, slug, description, isActive } = validation.data

        // Check if collection exists
        const existingCollection = await prisma.collection.findUnique({
            where: { id }
        })

        if (!existingCollection) {
            return NextResponse.json(
                { success: false, error: "Collection not found" },
                { status: 404 }
            )
        }

        // Check slug uniqueness (excluding current collection)
        if (slug !== existingCollection.slug) {
            const slugTaken = await prisma.collection.findUnique({
                where: { slug }
            })

            if (slugTaken) {
                return NextResponse.json(
                    { success: false, error: "A collection with this slug already exists" },
                    { status: 409 }
                )
            }
        }

        const collection = await prisma.collection.update({
            where: { id },
            data: {
                name,
                slug,
                description: description || null,
                isActive
            },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        await logActivity(
            session!.user.id,
            "UPDATE_COLLECTION",
            "Collection",
            collection.id,
            { name: collection.name, slug: collection.slug }
        )

        return NextResponse.json({
            success: true,
            message: "Collection updated successfully",
            data: collection
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to update collection" },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/collections/[id] - Delete collection
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    const { id } = await params

    try {
        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!collection) {
            return NextResponse.json(
                { success: false, error: "Collection not found" },
                { status: 404 }
            )
        }

        // Prevent deletion if collection has products
        if (collection._count.products > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Cannot delete collection with ${collection._count.products} product(s). Remove products first.`
                },
                { status: 400 }
            )
        }

        await prisma.collection.delete({
            where: { id }
        })

        await logActivity(
            session!.user.id,
            "DELETE_COLLECTION",
            "Collection",
            id,
            { name: collection.name }
        )

        return NextResponse.json({
            success: true,
            message: "Collection deleted successfully"
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to delete collection" },
            { status: 500 }
        )
    }
}
