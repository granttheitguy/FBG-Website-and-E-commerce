import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting product seed...')

    // 1. Create Categories
    const categories = [
        { name: 'Aso-Oke Series', slug: 'aso-oke' },
        { name: 'Senator Sets', slug: 'senator' },
        { name: 'Royal Agbada', slug: 'agbada' },
        { name: 'Contemporary', slug: 'contemporary' },
        { name: 'Accessories', slug: 'accessories' },
    ]

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { name: cat.name, slug: cat.slug },
        })
    }
    console.log('✅ Categories created')

    // 2. Create Products
    const products = [
        {
            name: 'Emerald Kaftan Set',
            slug: 'emerald-kaftan-set',
            descriptionShort: 'Detailed Embroidery',
            basePrice: 45000,
            categorySlug: 'senator',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
            isNew: true,
        },
        {
            name: 'Modern Aso-Oke Suit',
            slug: 'modern-aso-oke-suit',
            descriptionShort: 'Hand-woven Fabric',
            basePrice: 120000,
            categorySlug: 'aso-oke',
            image: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?w=600&q=80',
            isFeatured: true,
        },
        {
            name: 'Urban Agbada',
            slug: 'urban-agbada',
            descriptionShort: 'Short Sleeve, Black',
            basePrice: 65000,
            categorySlug: 'agbada',
            image: 'https://images.unsplash.com/photo-1621609764095-b32bbe35cf3a?w=600&q=80',
            isFeatured: true,
        },
        {
            name: 'Ankara Trim Set',
            slug: 'ankara-trim-set',
            descriptionShort: 'Sand / Ankara Patch',
            basePrice: 35000,
            categorySlug: 'contemporary',
            image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
        },
        {
            name: 'Royal Blue Agbada',
            slug: 'royal-blue-agbada',
            descriptionShort: '3-Piece Grandeur',
            basePrice: 85000,
            categorySlug: 'agbada',
            image: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&q=80',
        },
        {
            name: 'Linen Senator Suit',
            slug: 'linen-senator-suit',
            descriptionShort: 'Breathable Comfort',
            basePrice: 40000,
            categorySlug: 'senator',
            image: 'https://images.unsplash.com/photo-1507120410856-1f3551d4be09?w=600&q=80',
        },
    ]

    for (const p of products) {
        const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } })

        const product = await prisma.product.upsert({
            where: { slug: p.slug },
            update: {
                images: {
                    deleteMany: {},
                    create: { imageUrl: p.image, sortOrder: 0 },
                }
            },
            create: {
                name: p.name,
                slug: p.slug,
                descriptionShort: p.descriptionShort,
                basePrice: p.basePrice,
                isNew: p.isNew || false,
                isFeatured: p.isFeatured || false,
                categories: {
                    connect: { id: category?.id },
                },
                images: {
                    create: { imageUrl: p.image, sortOrder: 0 },
                },
                variants: {
                    createMany: {
                        data: [
                            { sku: `${p.slug}-s`, size: 'S', stockQty: 10 },
                            { sku: `${p.slug}-m`, size: 'M', stockQty: 15 },
                            { sku: `${p.slug}-l`, size: 'L', stockQty: 10 },
                            { sku: `${p.slug}-xl`, size: 'XL', stockQty: 5 },
                        ]
                    }
                }
            },
        })
        console.log(`✅ Product created: ${product.name}`)
    }
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
