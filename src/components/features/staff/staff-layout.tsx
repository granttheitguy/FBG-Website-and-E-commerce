"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
    LayoutDashboard,
    ShoppingBag,
    Scissors,
    ClipboardList,
    Users,
    MessageCircle,
    LogOut,
    Menu,
    X,
} from "lucide-react"

interface StaffLayoutClientProps {
    children: React.ReactNode
    userName: string
    signOutAction: () => Promise<void>
}

const navItems = [
    { href: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/staff/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/staff/bespoke", icon: Scissors, label: "Bespoke" },
    { href: "/staff/tasks", icon: ClipboardList, label: "My Tasks" },
    { href: "/staff/customers", icon: Users, label: "Customers" },
    { href: "/staff/interactions", icon: MessageCircle, label: "Interactions" },
] as const

export function StaffLayoutClient({ children, userName, signOutAction }: StaffLayoutClientProps) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === "/staff/dashboard") {
            return pathname === "/staff/dashboard"
        }
        return pathname.startsWith(href)
    }

    const sidebarContent = (
        <>
            <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Staff navigation">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                                active
                                    ? "bg-emerald-600 text-white font-medium"
                                    : "text-emerald-100 hover:bg-emerald-600/80 hover:text-white"
                            }`}
                            aria-current={active ? "page" : undefined}
                        >
                            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Sign out at bottom */}
            <div className="px-3 py-4 border-t border-emerald-600">
                <form action={signOutAction}>
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-emerald-100 hover:bg-emerald-600/80 hover:text-white transition-colors w-full"
                        aria-label="Sign out"
                    >
                        <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                        Sign out
                    </button>
                </form>
            </div>
        </>
    )

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <header className="bg-emerald-700 sticky top-0 z-30">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="lg:hidden p-2 -ml-2 text-emerald-100 hover:text-white hover:bg-emerald-600 rounded-sm transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <Link href="/staff/dashboard" className="flex items-center">
                            <h1 className="text-xl font-bold tracking-tighter font-serif text-white">
                                FBG{" "}
                                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded ml-1">
                                    STAFF
                                </span>
                            </h1>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-emerald-100 hidden sm:block">
                            {userName}
                        </span>
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
                    className={`fixed lg:sticky top-16 z-20 lg:z-0 h-[calc(100vh-4rem)] w-64 bg-emerald-700 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {sidebarContent}
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0" id="main-content">
                    {children}
                </main>
            </div>
        </div>
    )
}
