import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Heart } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import WishlistGrid from "@/components/features/shop/WishlistGrid"

export const metadata = {
    title: "Wishlist | Fashion By Grant",
    description: "Your saved items",
}

export default async function WishlistPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId: session.user.id },
        include: {
            product: {
                include: {
                    images: {
                        orderBy: { sortOrder: "asc" },
                        take: 1,
                    },
                    variants: {
                        where: { status: "ACTIVE" },
                        select: {
                            id: true,
                            size: true,
                            stockQty: true,
                            priceOverride: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    // Filter out any items whose product may have been deactivated
    const activeItems = wishlistItems.filter(
        (item) => item.product.status === "ACTIVE"
    )

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-serif font-bold tracking-[-0.02em] text-obsidian-900">
                    Wishlist
                </h1>
                <p className="text-sm text-obsidian-500 mt-1">
                    {activeItems.length} {activeItems.length === 1 ? "item" : "items"} saved
                </p>
            </div>

            {activeItems.length === 0 ? (
                <EmptyState
                    icon={<Heart className="w-8 h-8" />}
                    title="Your wishlist is empty"
                    description="Browse our collection and save the pieces you love. They will appear here for easy access."
                    action={{
                        label: "Browse Collection",
                        href: "/shop",
                    }}
                />
            ) : (
                <WishlistGrid items={activeItems} />
            )}
        </div>
    )
}
