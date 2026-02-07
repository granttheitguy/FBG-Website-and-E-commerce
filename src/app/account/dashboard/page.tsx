import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Package, User, HelpCircle, Bell, Heart, Star } from "lucide-react"

export default async function CustomerDashboard() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const userId = session.user.id

    // Fetch all dashboard data in parallel
    const [
        unreadNotifications,
        wishlistCount,
        unreviewedProducts,
    ] = await Promise.all([
        prisma.notification.count({
            where: { userId, isRead: false },
        }),
        prisma.wishlistItem.count({
            where: { userId },
        }),
        // Products the user has purchased (from delivered orders) but not yet reviewed
        prisma.orderItem.findMany({
            where: {
                order: {
                    userId,
                    status: "DELIVERED",
                },
                product: {
                    reviews: {
                        none: { userId },
                    },
                },
            },
            select: {
                productId: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: {
                            take: 1,
                            orderBy: { sortOrder: "asc" },
                            select: { imageUrl: true },
                        },
                    },
                },
            },
            distinct: ["productId"],
            take: 4,
        }),
    ])

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-obsidian-900">
                    Welcome back, {session.user.name}!
                </h2>
                <p className="text-obsidian-500 mt-1">
                    Here is what is happening with your account today.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                    href="/account/notifications"
                    className="bg-white rounded-sm border border-obsidian-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <div>
                        <p className="text-xs text-obsidian-500 uppercase tracking-wide font-medium">
                            Notifications
                        </p>
                        <p className="text-lg font-bold text-obsidian-900 font-tabular">
                            {unreadNotifications}
                            <span className="text-xs font-normal text-obsidian-400 ml-1">unread</span>
                        </p>
                    </div>
                </Link>
                <Link
                    href="/account/wishlist"
                    className="bg-white rounded-sm border border-obsidian-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <div>
                        <p className="text-xs text-obsidian-500 uppercase tracking-wide font-medium">
                            Wishlist
                        </p>
                        <p className="text-lg font-bold text-obsidian-900 font-tabular">
                            {wishlistCount}
                            <span className="text-xs font-normal text-obsidian-400 ml-1">
                                {wishlistCount === 1 ? "item" : "items"}
                            </span>
                        </p>
                    </div>
                </Link>
                <Link
                    href="/account/orders"
                    className="bg-white rounded-sm border border-obsidian-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <div>
                        <p className="text-xs text-obsidian-500 uppercase tracking-wide font-medium">
                            Orders
                        </p>
                        <p className="text-sm font-medium text-obsidian-700">
                            View your orders
                        </p>
                    </div>
                </Link>
                <Link
                    href="/account/profile"
                    className="bg-white rounded-sm border border-obsidian-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <div>
                        <p className="text-xs text-obsidian-500 uppercase tracking-wide font-medium">
                            Profile
                        </p>
                        <p className="text-sm font-medium text-obsidian-700">
                            Edit your info
                        </p>
                    </div>
                </Link>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Recent Orders */}
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-obsidian-900 mb-2">Orders</h3>
                    <p className="text-sm text-obsidian-500 mb-4">Check the status of your recent orders.</p>
                    <Link href="/account/orders" className="text-sm font-medium text-obsidian-900 hover:underline">
                        View Orders &rarr;
                    </Link>
                </div>

                {/* Profile */}
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center mb-4">
                        <User className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-obsidian-900 mb-2">Profile</h3>
                    <p className="text-sm text-obsidian-500 mb-4">Update your personal information.</p>
                    <Link href="/account/profile" className="text-sm font-medium text-obsidian-900 hover:underline">
                        Edit Profile &rarr;
                    </Link>
                </div>

                {/* Support */}
                <div className="bg-white rounded-sm border border-obsidian-200 p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-obsidian-100 rounded-full flex items-center justify-center mb-4">
                        <HelpCircle className="w-5 h-5 text-obsidian-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-obsidian-900 mb-2">Support</h3>
                    <p className="text-sm text-obsidian-500 mb-4">Need help with an order?</p>
                    <Link href="/contact" className="text-sm font-medium text-obsidian-900 hover:underline">
                        Contact Us &rarr;
                    </Link>
                </div>
            </div>

            {/* Review Prompt Section */}
            {unreviewedProducts.length > 0 && (
                <section className="bg-white rounded-sm border border-obsidian-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-obsidian-100">
                        <h3 className="text-sm font-semibold text-obsidian-900 flex items-center gap-2">
                            <Star className="w-4 h-4 text-gold-500" />
                            Share Your Experience
                        </h3>
                        <p className="text-xs text-obsidian-500 mt-1">
                            You have purchased these products but have not reviewed them yet.
                        </p>
                    </div>
                    <div className="divide-y divide-obsidian-100">
                        {unreviewedProducts.map((item) => (
                            <Link
                                key={item.productId}
                                href={`/product/${item.product.slug}`}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-obsidian-50 transition-colors"
                            >
                                <div className="w-12 h-14 bg-obsidian-100 rounded-sm overflow-hidden flex-shrink-0">
                                    {item.product.images[0] && (
                                        <img
                                            src={item.product.images[0].imageUrl}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-obsidian-900 truncate">
                                        {item.product.name}
                                    </p>
                                    <p className="text-xs text-obsidian-500">
                                        Tap to leave a review
                                    </p>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0" aria-hidden="true">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className="w-4 h-4 fill-obsidian-200 text-obsidian-200"
                                        />
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="px-6 py-3 bg-surface-secondary border-t border-obsidian-100">
                        <Link
                            href="/account/reviews"
                            className="text-xs font-medium text-gold-600 hover:text-gold-500 transition-colors"
                        >
                            View all your reviews &rarr;
                        </Link>
                    </div>
                </section>
            )}
        </div>
    )
}
