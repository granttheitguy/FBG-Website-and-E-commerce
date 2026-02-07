import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, User, LogOut, Settings, MessageSquare, Heart, Star, Bell, Ruler, MapPin, RotateCcw } from "lucide-react"
import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"

export default async function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const navigation = [
        { name: "Dashboard", href: "/account/dashboard", icon: LayoutDashboard },
        { name: "Orders", href: "/account/orders", icon: Package },
        { name: "Profile", href: "/account/profile", icon: User },
        { name: "Addresses", href: "/account/addresses", icon: MapPin },
        { name: "Wishlist", href: "/account/wishlist", icon: Heart },
        { name: "Reviews", href: "/account/reviews", icon: Star },
        { name: "Measurements", href: "/account/measurements", icon: Ruler },
        { name: "Notifications", href: "/account/notifications", icon: Bell },
        { name: "Returns", href: "/account/returns", icon: RotateCcw },
        { name: "Support", href: "/account/tickets", icon: MessageSquare },
    ]

    return (
        <div className="min-h-screen bg-surface-primary">
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-3 mb-8 lg:mb-0">
                        <div className="bg-white border border-obsidian-200 rounded-sm overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-obsidian-100 bg-obsidian-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-obsidian-200 flex items-center justify-center text-obsidian-500 font-medium text-lg">
                                        {session.user.name?.[0] || "U"}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-medium text-obsidian-900 truncate">{session.user.name}</p>
                                        <p className="text-xs text-obsidian-500 truncate">{session.user.email}</p>
                                    </div>
                                </div>
                            </div>
                            <nav className="p-2 space-y-1">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-obsidian-600 rounded-sm hover:bg-obsidian-50 hover:text-obsidian-900 transition-colors"
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                ))}
                                <form action={async () => {
                                    "use server"
                                    await signOut({ redirectTo: "/" })
                                }}>
                                    <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-sm hover:bg-red-50 transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </form>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9">
                        {children}
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    )
}
