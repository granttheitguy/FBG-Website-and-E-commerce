"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    UsersRound,
    Warehouse,
    Truck,
    FolderTree,
    Layers,
    FileText,
    Tag,
    Star,
    BarChart3,
    MessageSquare,
    RotateCcw,
    Mail,
    Calendar,
    Inbox,
    LogOut,
    Menu,
    X,
    Scissors,
    Factory,
    Palette,
    Settings,
    Calculator,
    type LucideIcon,
} from "lucide-react"

interface AdminLayoutClientProps {
    children: React.ReactNode
    userName: string
    signOutAction: () => Promise<void>
}

interface NavItem {
    href: string
    icon: LucideIcon
    label: string
}

interface NavSection {
    title: string
    items: NavItem[]
}

const navSections: NavSection[] = [
    {
        title: "Commerce",
        items: [
            { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
            { href: "/admin/products", icon: Package, label: "Products" },
            { href: "/admin/categories", icon: FolderTree, label: "Categories" },
            { href: "/admin/collections", icon: Layers, label: "Collections" },
            { href: "/admin/coupons", icon: Tag, label: "Coupons" },
            { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
            { href: "/admin/shipping", icon: Truck, label: "Shipping" },
            { href: "/admin/returns", icon: RotateCcw, label: "Returns" },
            { href: "/admin/reviews", icon: Star, label: "Reviews" },
        ],
    },
    {
        title: "Bespoke & Production",
        items: [
            { href: "/admin/bespoke", icon: Scissors, label: "Bespoke Orders" },
            { href: "/admin/production", icon: Factory, label: "Production Tasks" },
            { href: "/admin/fabrics", icon: Palette, label: "Fabrics" },
            { href: "/admin/suppliers", icon: Truck, label: "Suppliers" },
        ],
    },
    {
        title: "Customers",
        items: [
            { href: "/admin/customers", icon: Users, label: "Customer List" },
            { href: "/admin/segments", icon: UsersRound, label: "Segments" },
        ],
    },
    {
        title: "Content",
        items: [
            { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
            { href: "/admin/consultations", icon: Calendar, label: "Consultations" },
            { href: "/admin/messages", icon: Inbox, label: "Messages" },
            { href: "/admin/tickets", icon: MessageSquare, label: "Support Tickets" },
            { href: "/admin/pages", icon: FileText, label: "Pages" },
        ],
    },
    {
        title: "System",
        items: [
            { href: "/admin/accounting", icon: Calculator, label: "Accounting" },
            { href: "/admin/reports", icon: BarChart3, label: "Reports" },
            { href: "/admin/settings", icon: Settings, label: "Settings" },
        ],
    },
]

export function AdminLayoutClient({ children, userName, signOutAction }: AdminLayoutClientProps) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === "/admin/dashboard") {
            return pathname === "/admin/dashboard"
        }
        return pathname.startsWith(href)
    }

    const sidebarContent = (
        <nav
            className="flex-1 px-3 py-4 space-y-6 overflow-y-auto"
            role="navigation"
            aria-label="Admin navigation"
        >
            {navSections.map((section) => (
                <div key={section.title}>
                    <p className="px-3 mb-1.5 text-[10px] font-semibold text-obsidian-400 uppercase tracking-[0.1em]">
                        {section.title}
                    </p>
                    <div className="space-y-0.5">
                        {section.items.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors relative ${
                                        active
                                            ? "bg-obsidian-50 text-obsidian-900 font-medium"
                                            : "text-obsidian-600 hover:bg-obsidian-50 hover:text-obsidian-900"
                                    }`}
                                    aria-current={active ? "page" : undefined}
                                >
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1 bottom-1 w-[3px] bg-gold-500 rounded-r"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ))}
        </nav>
    )

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <header className="bg-white border-b border-obsidian-200 sticky top-0 z-30">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="lg:hidden p-2 -ml-2 text-obsidian-600 hover:text-obsidian-900 hover:bg-obsidian-50 rounded-sm transition-colors"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <Link href="/admin/dashboard" className="flex items-center">
                            <h1 className="text-xl font-bold tracking-tighter font-serif">
                                FBG{" "}
                                <span className="text-[10px] bg-obsidian-900 text-white px-1.5 py-0.5 rounded ml-1">
                                    PRO
                                </span>
                            </h1>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-obsidian-600 hidden sm:block">
                            {userName}
                        </span>
                        <form action={signOutAction}>
                            <button
                                type="submit"
                                className="text-sm text-obsidian-600 hover:text-obsidian-900 flex items-center gap-1.5 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`fixed lg:sticky top-16 z-20 lg:z-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-obsidian-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {sidebarContent}
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
