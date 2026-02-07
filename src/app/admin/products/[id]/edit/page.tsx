import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import ProductForm from "@/components/features/admin/ProductForm"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { orderBy: { size: 'asc' } }
        }
    })

    if (!product) {
        notFound()
    }

    return <ProductForm product={product} />
}
