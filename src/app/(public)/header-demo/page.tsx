'use client'

import Header from '@/components/layout/Header'
import TopBar from '@/components/layout/TopBar'
import { defaultNavigation } from '@/config/navigation'

export default function HeaderDemo() {
  return (
    <div className="w-full">
      {/* Promotional Top Bar */}
      <TopBar
        showPromo={true}
        promoText="🎁 Free shipping on orders over $50 | Use code GIFT20 for 20% off!"
      />

      {/* Main Header with Navigation */}
      <Header
        navItems={defaultNavigation}
        companyName="Gifts & Goodies"
      />

      {/* Demo Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Gifts & Goodies
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Our modern, responsive header includes:
        </p>
        <ul className="mt-6 space-y-3 text-gray-700">
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Sticky header with smooth animations</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Responsive dropdown menus with purple hover states</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Mobile hamburger menu with slide-in sidebar</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Search, Wishlist, and Shopping Bag icons</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Accessibility features (ARIA labels, keyboard navigation)</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Props-based navigation system for easy customization</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Lucide React icons for consistent, modern look</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-purple-600 font-bold">✓</span>
            <span>Soft shadows and rounded corners design</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
