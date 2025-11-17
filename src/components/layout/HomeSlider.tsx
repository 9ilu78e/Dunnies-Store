'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Gift, ArrowRight } from 'lucide-react'

const slides = [
  {
    title: "Special Holiday Gifts",
    subtitle: "Make every moment memorable",
    description: "Discover unique gifts for your loved ones",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=80",
    cta: "Shop Gifts",
    href: "/gifts",
    tag: "New Arrivals"
  },
  {
    title: "Thoughtful Gift Collections",
    subtitle: "Handpicked with love",
    description: "Perfect presents for every occasion",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80",
    cta: "Explore Gifts",
    href: "/gifts",
    tag: "Best Sellers"
  },
  {
    title: "Luxury Gift Experiences",
    subtitle: "Celebrate in style",
    description: "Premium selections for those who matter most",
    image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=1200&q=80",
    cta: "Shop Now",
    href: "/gifts",
    tag: "Exclusive"
  }
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[500px] sm:h-[600px] overflow-hidden bg-gradient-to-r from-purple-900 to-pink-900">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-4">
                  <Gift className="w-5 h-5 text-yellow-300" />
                  <span className="text-white text-sm font-semibold">{slide.tag}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-xl sm:text-2xl text-purple-100 mb-2">{slide.subtitle}</p>
                <p className="text-lg text-gray-200 mb-8">{slide.description}</p>
                <div className="flex flex-wrap gap-4">
                  <Link href={slide.href} className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2">
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/gifts" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all">
                    View All Gifts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}