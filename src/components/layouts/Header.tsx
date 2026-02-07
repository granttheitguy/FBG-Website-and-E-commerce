"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, Search, User, ShoppingBag, ChevronDown, MessageCircle, Heart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"
import { formatCurrency } from "@/lib/utils"
import { usePathname } from "next/navigation"
import SearchOverlay from "@/components/features/search/SearchOverlay"
import MobileSearchInput from "@/components/features/search/MobileSearchInput"
import NotificationBell from "@/components/features/notifications/NotificationBell"

const announcements = [
    "Free Delivery on Orders Over NGN 100,000",
    "Book Your Bespoke Consultation Today",
    "New Arrivals: Aso-Oke Heritage Collection",
]

export default function Header() {
    const { cartCount, isCartOpen, setIsCartOpen, items, removeItem, updateQuantity, cartTotal } = useCart()
    const { wishlistCount } = useWishlist()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [announcementIndex, setAnnouncementIndex] = useState(0)
    const [searchOpen, setSearchOpen] = useState(false)
    const pathname = usePathname()

    // Rotate announcements
    useEffect(() => {
        const interval = setInterval(() => {
            setAnnouncementIndex((prev) => (prev + 1) % announcements.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    // Close search when navigating
    useEffect(() => {
        setSearchOpen(false)
    }, [pathname])

    const isActive = (href: string) => pathname === href

    return (
        <>
            {/* Announcement Bar */}
            <div className="bg-obsidian-950 text-center py-2.5 overflow-hidden">
                <p className="text-[11px] tracking-[0.15em] uppercase text-gold-300 animate-fade-in" key={announcementIndex}>
                    {announcements[announcementIndex]}
                </p>
            </div>

            {/* Navigation */}
            <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-obsidian-100">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-3 -ml-3 min-w-[48px] min-h-[48px] flex items-center justify-center"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-5 h-5 text-obsidian-800" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex flex-col items-center lg:items-start group">
                            <span className="text-[28px] tracking-[0.12em] font-semibold text-obsidian-900 leading-none font-serif">FBG</span>
                            <span className="h-px w-8 bg-gold-500 mt-0.5 hidden lg:block"></span>
                            <span className="text-[10px] tracking-[0.35em] font-medium text-obsidian-500 uppercase mt-1 group-hover:text-obsidian-900 transition-colors">Fashion By Grant</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-8">
                            <div className="relative group">
                                <button className="flex items-center gap-1 text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors py-6 tracking-[0.03em]">
                                    Shop
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                {/* Mega Menu */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-screen max-w-4xl bg-white shadow-xl border border-obsidian-100 rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="grid grid-cols-4 gap-8 p-8">
                                        <div>
                                            <h4 className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-4">African Luxury</h4>
                                            <ul className="space-y-3">
                                                <li><Link href="/shop?category=aso-oke" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Aso-Oke Series</Link></li>
                                                <li><Link href="/shop?category=senator" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Senator Sets</Link></li>
                                                <li><Link href="/shop?category=agbada" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Royal Agbada</Link></li>
                                                <li><Link href="/shop?category=wedding" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Wedding Guest</Link></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-4">Contemporary</h4>
                                            <ul className="space-y-3">
                                                <li><Link href="/shop?category=contemporary" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Adire Kaftans</Link></li>
                                                <li><Link href="/shop?category=contemporary" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Ankara Infusions</Link></li>
                                                <li><Link href="/shop?category=contemporary" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Urban Trousers</Link></li>
                                                <li><Link href="/shop?category=contemporary" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Essential Tees</Link></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-4">Accessories</h4>
                                            <ul className="space-y-3">
                                                <li><Link href="/shop?category=accessories" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Leather Bags</Link></li>
                                                <li><Link href="/shop?category=accessories" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Traditional Caps</Link></li>
                                                <li><Link href="/shop?category=accessories" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Footwear</Link></li>
                                                <li><Link href="/shop?category=accessories" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Cufflinks</Link></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-4">Services</h4>
                                            <ul className="space-y-3">
                                                <li><Link href="/bespoke" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Bespoke Fitting</Link></li>
                                                <li><Link href="/alterations" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Alterations</Link></li>
                                                <li><Link href="/fabric-sourcing" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Fabric Sourcing</Link></li>
                                                <li><Link href="/group-orders" className="text-sm text-obsidian-600 hover:text-obsidian-900 link-underline">Group Orders</Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/bespoke"
                                className={`text-sm tracking-[0.03em] transition-colors ${isActive('/bespoke') ? 'text-obsidian-900 border-b-2 border-gold-500 pb-1' : 'text-obsidian-600 hover:text-obsidian-900'}`}
                            >
                                Bespoke
                            </Link>
                            <Link
                                href="/studio"
                                className={`text-sm tracking-[0.03em] transition-colors ${isActive('/studio') ? 'text-obsidian-900 border-b-2 border-gold-500 pb-1' : 'text-obsidian-600 hover:text-obsidian-900'}`}
                            >
                                The Studio
                            </Link>
                            <Link
                                href="/contact"
                                className={`text-sm tracking-[0.03em] transition-colors ${isActive('/contact') ? 'text-obsidian-900 border-b-2 border-gold-500 pb-1' : 'text-obsidian-600 hover:text-obsidian-900'}`}
                            >
                                Book Grant
                            </Link>
                        </div>

                        {/* Right Icons */}
                        <div className="flex items-center gap-0 sm:gap-1">
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-obsidian-600 hover:text-obsidian-900 transition-colors hidden sm:flex"
                                aria-label={searchOpen ? "Close search" : "Search products"}
                                aria-expanded={searchOpen}
                            >
                                {searchOpen ? (
                                    <X className="w-5 h-5" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                            </button>
                            <Link
                                href="/login"
                                className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-obsidian-600 hover:text-obsidian-900 transition-colors hidden sm:flex"
                                aria-label="My account"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/account/wishlist"
                                className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-obsidian-600 hover:text-obsidian-900 transition-colors relative hidden sm:flex"
                                aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
                            >
                                <Heart className="w-5 h-5" />
                                {wishlistCount > 0 && (
                                    <span
                                        className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium"
                                        aria-hidden="true"
                                    >
                                        {wishlistCount > 99 ? "99+" : wishlistCount}
                                    </span>
                                )}
                            </Link>
                            <div className="hidden sm:block">
                                <NotificationBell />
                            </div>
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-obsidian-600 hover:text-obsidian-900 transition-colors relative"
                                aria-label={`Shopping bag, ${cartCount} items`}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-obsidian-900 text-white text-[10px] rounded-full flex items-center justify-center font-medium">{cartCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Search Overlay */}
                {searchOpen && (
                    <SearchOverlay onClose={() => setSearchOpen(false)} />
                )}
            </header>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 bg-white z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <div className="flex items-center justify-between p-4 border-b border-obsidian-100">
                    <div className="flex flex-col">
                        <span className="text-xl tracking-[0.12em] font-semibold text-obsidian-900 font-serif">FBG</span>
                        <span className="text-[9px] tracking-[0.3em] uppercase text-obsidian-500">Fashion By Grant</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center"
                        aria-label="Close navigation menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-72px)]">
                    {/* Search */}
                    <MobileSearchInput onNavigate={() => setMobileMenuOpen(false)} />

                    {/* Shop Section */}
                    <nav className="space-y-1">
                        <p className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-3">Shop</p>
                        <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-900 font-medium min-h-[48px] flex items-center">New Arrivals</Link>
                        <Link href="/shop?category=agbada" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">African Luxury</Link>
                        <Link href="/shop?category=contemporary" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Contemporary Wear</Link>
                        <Link href="/shop?category=accessories" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Fabrics & Textiles</Link>
                    </nav>

                    {/* Services Section */}
                    <nav className="space-y-1 border-t border-obsidian-100 pt-4">
                        <p className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-3">Services</p>
                        <Link href="/bespoke" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Bespoke Fitting</Link>
                        <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Book Appointment</Link>
                    </nav>

                    {/* Studio Section */}
                    <nav className="space-y-1 border-t border-obsidian-100 pt-4">
                        <p className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-3">The Studio</p>
                        <Link href="/studio" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Our Story</Link>
                        <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Visit Us</Link>
                    </nav>

                    {/* Account Section */}
                    <nav className="space-y-1 border-t border-obsidian-100 pt-4">
                        <p className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-[0.12em] mb-3">Account</p>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Sign In</Link>
                        <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">My Orders</Link>
                        <Link href="/account/wishlist" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">
                            Wishlist{wishlistCount > 0 && ` (${wishlistCount})`}
                        </Link>
                        <Link href="/account/notifications" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-base text-obsidian-600 min-h-[48px] flex items-center">Notifications</Link>
                    </nav>

                    {/* Cart Summary */}
                    <div className="border-t border-obsidian-100 pt-4">
                        <button
                            onClick={() => { setMobileMenuOpen(false); setIsCartOpen(true) }}
                            className="flex items-center gap-3 py-3 text-base text-obsidian-900 font-medium w-full min-h-[48px]"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Your Bag ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                        </button>
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className={`fixed inset-0 z-50 ${isCartOpen ? '' : 'invisible'}`}>
                <div
                    onClick={() => setIsCartOpen(false)}
                    className={`absolute inset-0 bg-obsidian-950/50 transition-opacity duration-250 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transitionTimingFunction: 'linear' }}
                ></div>
                <div
                    className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white transform transition-transform duration-400 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-6 border-b border-obsidian-100">
                            <h2 className="text-lg font-medium text-obsidian-900">Shopping Bag ({cartCount})</h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-3 -mr-3 min-w-[48px] min-h-[48px] flex items-center justify-center"
                                aria-label="Close shopping bag"
                            >
                                <X className="w-5 h-5 text-obsidian-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <ShoppingBag className="w-12 h-12 text-obsidian-200 mb-4" />
                                    <p className="text-sm text-obsidian-500 mb-2">Your bag is empty</p>
                                    <p className="text-xs text-obsidian-400 mb-6">Explore our latest collection.</p>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="w-full bg-obsidian-900 text-white py-3.5 text-sm font-medium hover:bg-obsidian-800 transition-colors rounded-sm"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-20 h-24 bg-obsidian-100 rounded-sm overflow-hidden flex-shrink-0">
                                                {item.image && (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-sm font-medium text-obsidian-900 line-clamp-2">{item.name}</h3>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-obsidian-400 hover:text-obsidian-900 p-3 -mr-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                            aria-label={`Remove ${item.name} from bag`}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-obsidian-500 mt-1">Size: {item.size}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center border border-obsidian-200 rounded-sm">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="w-10 h-10 flex items-center justify-center text-obsidian-500 hover:text-obsidian-900"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-10 h-10 flex items-center justify-center text-obsidian-500 hover:text-obsidian-900"
                                                            aria-label="Increase quantity"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <p className="text-sm font-medium text-obsidian-900 font-tabular">{formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-6 border-t border-obsidian-100 bg-surface-secondary">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-obsidian-600">Subtotal</span>
                                    <span className="text-sm font-medium text-obsidian-900 font-tabular">{formatCurrency(cartTotal)}</span>
                                </div>
                                <p className="text-xs text-obsidian-500 mb-4 text-center">Shipping and taxes calculated at checkout.</p>
                                <Link
                                    href="/checkout"
                                    onClick={() => setIsCartOpen(false)}
                                    className="block w-full bg-obsidian-900 text-white py-4 font-medium hover:bg-obsidian-800 transition-colors rounded-sm mb-3 text-center text-sm tracking-wide"
                                >
                                    Checkout · {formatCurrency(cartTotal)}
                                </Link>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors py-2"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* WhatsApp Floating Button */}
            <a
                href="https://wa.me/2348001234567?text=Hello%2C%20I%27m%20interested%20in%20FBG%20fashion"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-105 transition-transform z-40"
                aria-label="Chat on WhatsApp"
            >
                <MessageCircle className="w-6 h-6 text-white" />
            </a>
        </>
    )
}
