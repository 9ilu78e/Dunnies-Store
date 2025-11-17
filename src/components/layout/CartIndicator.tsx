'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

interface CartIndicatorProps {
  itemCount?: number
  totalPrice?: number
}

export default function CartIndicator({
  itemCount = 0,
  totalPrice,
}: CartIndicatorProps) {
  return (
    <Link
      href="/cart"
      className="relative group"
    >
      <div className="p-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200">
        <ShoppingBag className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>

      
      {itemCount > 0 && (
        <div className="hidden md:block absolute -bottom-14 -right-8 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
          <p className="font-semibold">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          {totalPrice && <p>${totalPrice.toFixed(2)}</p>}
          <div className="absolute -top-1 left-6 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </Link>
  )
}
