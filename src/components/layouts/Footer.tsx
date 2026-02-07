import Link from "next/link"
import { Instagram, Twitter, Facebook } from "lucide-react"

export default function Footer() {
    return (
        <footer className="bg-surface-secondary pt-16 pb-8 border-t border-obsidian-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="flex flex-col items-start group">
                            <span className="text-2xl tracking-[0.12em] font-semibold text-obsidian-900 leading-none font-serif">FBG</span>
                            <span className="h-px w-6 bg-gold-500 mt-1"></span>
                            <span className="text-[9px] tracking-[0.2em] font-medium text-obsidian-500 uppercase mt-1">Fashion By Grant</span>
                        </Link>
                        <p className="text-sm text-obsidian-600 mt-4 leading-relaxed">Premium African bespoke fashion and contemporary clothing situated in Alagbado, Lagos.</p>
                        <div className="flex items-center gap-4 mt-6">
                            <Link href="https://instagram.com" className="text-obsidian-500 hover:text-obsidian-900 transition-colors p-1" aria-label="Follow us on Instagram">
                                <Instagram className="w-5 h-5" />
                            </Link>
                            <Link href="https://twitter.com" className="text-obsidian-500 hover:text-obsidian-900 transition-colors p-1" aria-label="Follow us on Twitter">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="https://facebook.com" className="text-obsidian-500 hover:text-obsidian-900 transition-colors p-1" aria-label="Follow us on Facebook">
                                <Facebook className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-semibold text-obsidian-900 uppercase tracking-[0.12em] mb-4">Shop</h4>
                        <ul className="space-y-3">
                            <li><Link href="/shop?category=senator" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Senator Wears</Link></li>
                            <li><Link href="/shop?category=agbada" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Agbada Series</Link></li>
                            <li><Link href="/shop?category=adire" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Adire Collections</Link></li>
                            <li><Link href="/shop?category=contemporary" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Contemporary</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-semibold text-obsidian-900 uppercase tracking-[0.12em] mb-4">Support</h4>
                        <ul className="space-y-3">
                            <li><Link href="/size-guide" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Size Guide</Link></li>
                            <li><Link href="/delivery" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Delivery Rates</Link></li>
                            <li><Link href="/contact" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Book Measurement</Link></li>
                            <li><Link href="/faq" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">FAQs</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-semibold text-obsidian-900 uppercase tracking-[0.12em] mb-4">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">About Grant</Link></li>
                            <li><Link href="/studio" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">The Studio</Link></li>
                            <li><Link href="/bespoke" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Bespoke Fitting</Link></li>
                            <li><Link href="/contact" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Contact</Link></li>
                            <li><Link href="/terms" className="text-sm text-obsidian-600 hover:text-obsidian-900 transition-colors">Terms & Conditions</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-semibold text-obsidian-900 uppercase tracking-[0.12em] mb-4">Newsletter</h4>
                        <p className="text-xs text-obsidian-600 mb-4">Subscribe for latest styles.</p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Email"
                                className="bg-white border border-obsidian-200 text-sm px-3 py-2.5 w-full rounded-l-sm focus:outline-none focus:border-obsidian-900 focus:ring-1 focus:ring-obsidian-900"
                            />
                            <button className="bg-obsidian-900 text-white px-4 py-2.5 rounded-r-sm text-[11px] uppercase tracking-wider font-medium hover:bg-obsidian-800 transition-colors">Join</button>
                        </div>
                    </div>
                </div>
                <div className="border-t border-obsidian-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-obsidian-500">&copy; 2026 Fashion By Grant (FBG). All rights reserved.</p>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-obsidian-500">Secure Payments via Paystack</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
