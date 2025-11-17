'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

interface WishlistButtonProps {
  itemId?: string | number
  onToggle?: (itemId: string | number, isWishlisted: boolean) => void
  initialState?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function WishlistButton({
  itemId,
  onToggle,
  initialState = false,
  size = 'md',
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialState)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const paddingClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  }

  const handleToggle = () => {
    const newState = !isWishlisted
    setIsWishlisted(newState)
    if (onToggle && itemId) {
      onToggle(itemId, newState)
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`${paddingClasses[size]} rounded-lg transition-all duration-200 ${
        isWishlisted
          ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
          : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
      }`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-transform duration-200 ${
          isWishlisted ? 'fill-current' : ''
        }`}
      />
    </button>
  )
}
