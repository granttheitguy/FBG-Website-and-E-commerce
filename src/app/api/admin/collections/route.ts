import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/rbac"
import { logActivity } from "@/lib/logger"
import { collectionSchema } from "@/lib/validation-schemas"

// GET /api/admin/collections - List all collections
export async function GET() {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

    try {
        const collections = await prisma.collection.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: collections
        })
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch collections" },
            { status: 500 }
        )
    }
}

// POST /api/admin/collections - Create collection
export async function POST(request: NextRequest) {
    const { error, session } = await requireRole(["SUPER_ADMIN", "ADMIN"])
    if (error) return error

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

        // Check slug uniqueness
        const existingCollection = await prisma.collection.findUnique({
            where: { slug }
        })

        if (existingCollection) {
            return NextResponse.json(
                { success: false, error: "A collection with this slug already exists" },
                { status: 409 }
            )
        }

        const collection = await prisma.collection.create({
            data: {
                name,
                slug,
                description: description || null,
                isActive: isActive !== undefined ? isActive : true
            },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        await logActivity(
            session!.user.id,
            "CREATE_COLLECTION",
            "Collection",
            collection.id,
            { name: collection.name, slug: collection.slug }
        )

        return NextResponse.json(
            {
                success: true,
                message: "Collection created successfully",
                data: collection
            },
            { status: 201 }
        )
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Failed to create collection" },
            { status: 500 }
        )
    }
}
