'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Search, Heart, ShoppingBag, ChevronDown, MapPin, Phone, Mail } from 'lucide-react'
import { defaultNavigation } from '@/config/navigation'

interface TopBarProps {
  showPromo?: boolean
  promoText?: string
}

export default function TopBar({
  showPromo = true,
  promoText = 'Free shipping on orders over $50 | Use code GIFT20 for 20% off!',
}: TopBarProps) {
  const [isVisible, setIsVisible] = useState(showPromo)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm font-medium text-center flex-1">{promoText}</p>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 hover:text-purple-200 transition-colors"
          aria-label="Close promo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
