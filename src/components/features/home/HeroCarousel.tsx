"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

const heroSlides = [
    {
        image: "/hero-slide-indigenous.png",
        tag: "Indigenous Heritage",
        title: "Celebrate\nYour Culture.",
        description: "Authentic African prints and traditional fabrics reimagined for the modern wardrobe. Agbada, Aso-Oke, Ankara gowns — we honor our heritage.",
        cta1: { text: "Shop Indigenous", href: "/shop?category=indigenous" },
        cta2: { text: "Learn More", href: "/contact" }
    },
    {
        image: "/hero-slide-bespoke.jpg",
        tag: "Bespoke Excellence",
        title: "Tailored to\nPerfection.",
        description: "Experience the art of custom tailoring with premium Aso-Oke, Ankara, and contemporary fabrics. Each piece is crafted to fit like a second skin.",
        cta1: { text: "View Bespoke", href: "/shop?category=bespoke" },
        cta2: { text: "Book Fitting", href: "/contact" }
    },
    {
        image: "/hero-slide-urban.png",
        tag: "Urban Fusion",
        title: "Modern African\nLuxury.",
        description: "Contemporary designs infused with African aesthetics. Bold patterns, vibrant colors, and urban sophistication for the fashion-forward individual.",
        cta1: { text: "Explore Collection", href: "/shop?category=urban-fusion" },
        cta2: { text: "Get Inspired", href: "/contact" }
    }
]

export default function HeroCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const isTransitioning = useRef(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % heroSlides.length)
        }, 5000)
    }, [])

    useEffect(() => {
        startTimer()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [startTimer])

    const goToSlide = (index: number) => {
        if (isTransitioning.current) return
        isTransitioning.current = true
        setCurrentSlide(index)
        startTimer()
        setTimeout(() => { isTransitioning.current = false }, 700)
    }

    const nextSlide = () => {
        goToSlide((currentSlide + 1) % heroSlides.length)
    }

    const prevSlide = () => {
        goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length)
    }

    return (
        <>
            {/* Slides */}
            {heroSlides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                    style={{ transitionDuration: '700ms', transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950/60 via-obsidian-950/20 to-transparent z-10"></div>
                    <div className={`absolute inset-0 ${index === currentSlide ? 'animate-ken-burns' : ''}`}>
                        <Image
                            src={slide.image}
                            alt={slide.title.replace('\n', ' ')}
                            fill
                            priority={index === 0}
                            sizes="100vw"
                            className="object-cover object-center"
                        />
                    </div>
                    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 h-full flex items-center">
                        <div className="max-w-xl">
                            {index === currentSlide && (
                                <>
                                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-gold-300 mb-4 animate-fade-in">
                                        {slide.tag}
                                    </p>
                                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 font-serif animate-fade-in-up" style={{ letterSpacing: '-0.02em' }}>
                                        {slide.title.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                {i === 0 && <br />}
                                            </span>
                                        ))}
                                    </h1>
                                    <p className="text-sm sm:text-base text-white/90 mb-8 leading-relaxed max-w-md animate-fade-in-up animation-delay-200">
                                        {slide.description}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
                                        <Link
                                            href={slide.cta1.href}
                                            className="inline-flex items-center justify-center gap-2 bg-white text-obsidian-900 px-10 py-4 text-[13px] font-medium tracking-[0.1em] uppercase hover:bg-gold-50 transition-colors"
                                        >
                                            {slide.cta1.text}
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={slide.cta2.href}
                                            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-10 py-4 text-[13px] font-medium tracking-[0.1em] uppercase hover:bg-white/10 transition-colors"
                                        >
                                            {slide.cta2.text}
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-0.5 rounded-full transition-all duration-500 ${index === currentSlide
                            ? "w-10 bg-gold-400"
                            : "w-2 bg-white/40 hover:bg-white/60"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </>
    )
}
