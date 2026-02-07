import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"
import ProductCard from "@/components/features/shop/ProductCard"
import ConsultationForm from "@/components/features/home/ConsultationForm"
import Link from "next/link"
import { ArrowRight, MapPin, Clock, Phone, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getCachedProducts } from "@/lib/cache"
import HeroCarousel from "@/components/features/home/HeroCarousel"

export const revalidate = 300

interface Product {
    id: string
    name: string
    slug: string
    basePrice: number
    descriptionShort: string | null
    images: { imageUrl: string }[]
    variants: { id: string; size: string | null; stockQty: number }[]
    isNew: boolean
    isFeatured: boolean
}

export default async function HomePage() {
    const latestDrops = await getCachedProducts({ limit: 4 })

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main id="main-content">
                {/* Hero Carousel */}
                <section className="relative min-h-screen flex items-center overflow-hidden">
                    <HeroCarousel />
                </section>

                {/* Categories Grid — Asymmetric Editorial Layout */}
                <section className="py-16 sm:py-24 bg-surface-primary">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-[36px] font-serif text-obsidian-900 mb-3 leading-[1.2]">Collections</h2>
                            <p className="text-obsidian-600 text-sm sm:text-base">Curated African and Contemporary styles</p>
                            <span className="brand-accent-line mx-auto"></span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {/* Hero Category — Bespoke (spans 2 cols on desktop) */}
                            <Link href="/shop?category=bespoke" className="group relative overflow-hidden bg-obsidian-200 rounded-sm col-span-2 lg:col-span-2 aspect-[16/9]">
                                <img
                                    src="/collection-bespoke.jpg"
                                    alt="Bespoke tailoring"
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-transparent to-transparent"></div>
                                <div className="absolute bottom-5 left-5 right-5">
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-gold-300 mb-1">Premium Service</p>
                                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Bespoke</h3>
                                    <p className="text-sm text-white/70 mt-1">Tailored Perfection</p>
                                </div>
                            </Link>
                            {/* Indigenous */}
                            <Link href="/shop?category=indigenous" className="group relative aspect-[3/4] overflow-hidden bg-obsidian-200 rounded-sm">
                                <img
                                    src="/collection-indigenous.jpg"
                                    alt="Indigenous African fashion"
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-serif font-bold text-white">Indigenous</h3>
                                    <p className="text-xs text-white/70 mt-0.5">Rich African Fabrics</p>
                                </div>
                            </Link>
                            {/* Urban Fusion */}
                            <Link href="/shop?category=urban-fusion" className="group relative aspect-[3/4] overflow-hidden bg-obsidian-200 rounded-sm">
                                <img
                                    src="/collection-urban-fusion.jpg"
                                    alt="Urban Fusion style"
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-serif font-bold text-white">Urban Fusion</h3>
                                    <p className="text-xs text-white/70 mt-0.5">Adire & Ankara Mix</p>
                                </div>
                            </Link>
                            {/* Accessories */}
                            <Link href="/shop?category=accessories" className="group relative aspect-[3/4] overflow-hidden bg-obsidian-200 rounded-sm">
                                <img
                                    src="/collection-accessories.jpg"
                                    alt="Fashion accessories"
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/70 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-serif font-bold text-white">Accessories</h3>
                                    <p className="text-xs text-white/70 mt-0.5">Finishing Touches</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Editorial Story Section */}
                <section className="relative w-full h-[60vh] overflow-hidden">
                    <img
                        src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/30104e3c-5eea-4b93-93e9-5313698a7156_1600w.webp"
                        alt="Grant at work in the studio"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-obsidian-950/50"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                        <div className="max-w-2xl">
                            <p className="font-serif text-2xl sm:text-[36px] italic text-white leading-snug mb-4" style={{ fontWeight: 400 }}>
                                &ldquo;I don&rsquo;t just sew clothes; I design heritage.&rdquo;
                            </p>
                            <span className="inline-block w-12 h-px bg-gold-500 mb-3"></span>
                            <p className="text-sm tracking-[0.15em] uppercase text-gold-300">Grant &mdash; Founder, FBG</p>
                        </div>
                    </div>
                </section>

                {/* Featured Products */}
                <section id="shop" className="py-16 sm:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-2xl sm:text-[36px] font-serif text-obsidian-900 mb-2 leading-[1.2]">Latest Drops</h2>
                                <p className="text-obsidian-600 text-sm sm:text-base">Fresh from our Alagbado Studio</p>
                                <span className="brand-accent-line"></span>
                            </div>
                            <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-obsidian-900 hover:text-obsidian-600 transition-colors link-underline">
                                View Catalog
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {latestDrops.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                                {latestDrops.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-surface-secondary rounded-sm">
                                <p className="text-obsidian-500">No products available at the moment.</p>
                            </div>
                        )}

                        <Link href="/shop" className="sm:hidden flex items-center justify-center gap-2 mt-8 text-sm font-medium text-obsidian-900">
                            View All Products
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>

                {/* The Craft Section */}
                <section className="py-16 sm:py-24 bg-surface-secondary">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <h2 className="text-2xl sm:text-[36px] font-serif text-obsidian-900 mb-3 leading-[1.2]">The Craft</h2>
                            <p className="text-obsidian-600 text-sm sm:text-base max-w-lg mx-auto">Every piece tells a story of heritage, precision, and artistry passed down through generations.</p>
                            <span className="brand-accent-line mx-auto"></span>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-5 border-2 border-gold-200">
                                    <img
                                        src="/craft-adire.jpg"
                                        alt="Adire dyeing process"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-base font-serif font-bold text-obsidian-900 mb-2">Hand-Dyed Adire</h3>
                                <p className="text-sm text-obsidian-600 leading-relaxed max-w-xs mx-auto">Traditional Yoruba resist-dyeing techniques creating unique indigo patterns on every piece.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-5 border-2 border-gold-200">
                                    <img
                                        src="/craft-aso-oke.jpg"
                                        alt="Aso-Oke weaving"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-base font-serif font-bold text-obsidian-900 mb-2">Woven Aso-Oke</h3>
                                <p className="text-sm text-obsidian-600 leading-relaxed max-w-xs mx-auto">Premium hand-woven cloth from the loom, a centerpiece of Yoruba ceremonial fashion.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-5 border-2 border-gold-200">
                                    <img
                                        src="/craft-tailoring.jpg"
                                        alt="Bespoke tailoring"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-base font-serif font-bold text-obsidian-900 mb-2">Bespoke Tailoring</h3>
                                <p className="text-sm text-obsidian-600 leading-relaxed max-w-xs mx-auto">Precision cuts and expert construction ensuring every garment fits like a second skin.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bespoke CTA Banner */}
                <section id="bespoke" className="py-16 sm:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="relative rounded-sm overflow-hidden">
                            <img
                                src="/cta-bespoke.jpg"
                                alt="Bespoke fashion tailoring"
                                className="w-full h-96 sm:h-[500px] object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950/85 to-obsidian-950/20"></div>
                            <div className="absolute inset-0 flex items-center">
                                <div className="px-8 sm:px-16 max-w-lg">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-gold-300 mb-3">The FBG Bespoke Experience</p>
                                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 font-serif" style={{ letterSpacing: '-0.02em' }}>Tailored to Perfection</h2>
                                    <p className="text-white/80 mb-8 leading-relaxed text-sm sm:text-base">Visit our studio in Alagbado for a consultation. We take precise measurements to create custom outfits using premium Aso-Oke, Linen, or Wool that fit like a second skin.</p>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center gap-2 bg-white text-obsidian-900 px-12 py-4.5 text-[13px] font-medium tracking-[0.15em] uppercase hover:bg-gold-50 transition-colors"
                                    >
                                        Book Appointment
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="studio" className="py-16 sm:py-24 bg-surface-secondary">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div className="relative">
                                <img
                                    src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/30104e3c-5eea-4b93-93e9-5313698a7156_1600w.webp"
                                    alt="Grant working in the studio"
                                    className="rounded-sm w-full grayscale hover:grayscale-0 transition-all duration-700"
                                />
                                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gold-100 rounded-full -z-10"></div>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-gold-600 mb-4">The Designer</p>
                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-obsidian-900 mb-6 font-serif" style={{ letterSpacing: '-0.02em' }}>
                                    Crafting Culture <br />in Ijaiye
                                </h2>
                                <div className="space-y-4 text-obsidian-600 leading-relaxed text-sm sm:text-base">
                                    <p>
                                        Fashion By Grant (FBG) started with a passion for indigenous textiles and a vision: to elevate the standard of African fashion in Lagos mainland.
                                    </p>
                                    <p>
                                        Based in the vibrant community of Alagbado/Ijaiye, Grant combines traditional African fabrics like Adire, Ankara, and Aso-oke with contemporary silhouettes. Whether it&rsquo;s a Senator outfit for a wedding or a fusion piece for an event, excellence is our signature.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-8">
                                    <div>
                                        <p className="text-sm font-semibold text-obsidian-900">The Studio</p>
                                        <p className="text-sm text-obsidian-500 mt-1">Visit us in Alagbado for fabric selection.</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-obsidian-900">Doorstep Delivery</p>
                                        <p className="text-sm text-obsidian-500 mt-1">We deliver across Lagos and interstate.</p>
                                    </div>
                                </div>
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-obsidian-900 hover:text-obsidian-600 transition-colors link-underline"
                                >
                                    Get Directions
                                    <MapPin className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-16 sm:py-24 bg-obsidian-950 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 font-serif" style={{ letterSpacing: '-0.02em' }}>Visit Our Studio</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-6 h-6 text-gold-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium text-lg">Alagbado / Ijaiye</h3>
                                            <p className="text-obsidian-400 mt-1">No 15, Station Road, Off Lagos-Abeokuta Expressway,<br />Alagbado, Lagos State.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Clock className="w-6 h-6 text-gold-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium text-lg">Opening Hours</h3>
                                            <p className="text-obsidian-400 mt-1">Mon - Sat: 9:00 AM - 7:00 PM<br />Sun: By Appointment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Phone className="w-6 h-6 text-gold-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium text-lg">Contact Grant</h3>
                                            <p className="text-obsidian-400 mt-1">+234 800 123 4567<br />hello@fashionbygrant.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ConsultationForm />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
