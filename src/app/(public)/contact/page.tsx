import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import ContactForm from "./ContactForm"

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main id="main-content">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs text-obsidian-500 mb-8">
                        <Link href="/" className="hover:text-obsidian-900 transition-colors">Home</Link>
                        <span className="text-obsidian-400">/</span>
                        <span className="text-obsidian-900">Contact</span>
                    </div>

                    <div className="text-center mb-16">
                        <h1 className="text-3xl sm:text-[40px] font-bold font-serif text-obsidian-900 mb-4" style={{ letterSpacing: '-0.02em' }}>Contact Us</h1>
                        <p className="text-obsidian-600 max-w-2xl mx-auto text-sm sm:text-base">
                            We&rsquo;d love to hear from you. Whether you have a question about our products,
                            need assistance with an order, or just want to say hello.
                        </p>
                        <span className="brand-accent-line mx-auto"></span>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold font-serif text-obsidian-900 mb-6" style={{ letterSpacing: '-0.02em' }}>Get in Touch</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-gold-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-obsidian-900 mb-1">Visit Us</h3>
                                            <p className="text-obsidian-600 text-sm">No 15, Station Road, Off Lagos-Abeokuta Expressway, Alagbado, Lagos State</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-gold-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-obsidian-900 mb-1">Email Us</h3>
                                            <p className="text-obsidian-600 text-sm">hello@fashionbygrant.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center shrink-0">
                                            <Phone className="w-5 h-5 text-gold-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-obsidian-900 mb-1">Call Us</h3>
                                            <p className="text-obsidian-600 text-sm">+234 800 123 4567</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-secondary p-8 rounded-sm">
                                <h3 className="font-medium text-obsidian-900 mb-2">Opening Hours</h3>
                                <div className="space-y-2 text-obsidian-600 text-sm">
                                    <div className="flex justify-between">
                                        <span>Monday - Friday</span>
                                        <span>9:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Saturday</span>
                                        <span>10:00 AM - 4:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sunday</span>
                                        <span>Closed</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <ContactForm />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
