'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  ChevronDown,
  Gift,
  Grid3x3,
  HelpCircle,
  Phone,
} from 'lucide-react'
import SearchBar from './SearchBar'
import Button from '@/components/ui/Button'

interface NavDropdownItem {
  label: string
  href: string
}

interface NavItem {
  label: string
  href?: string
  icon?: React.ReactNode
  children?: NavDropdownItem[]
}

interface HeaderProps {
  navItems?: NavItem[]
  logo?: string
  companyName?: string
}

export default function Header({
  navItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Menu className="w-5 h-5" />,
    },
    {
      label: 'Gifts Collections',
      icon: <Gift className="w-5 h-5" />,
      children: [
        { label: 'Birthday Gifts', href: '/categories/birthday' },
        { label: 'Wedding Gifts', href: '/categories/wedding' },
        { label: 'Anniversary Gifts', href: '/categories/anniversary' },
        { label: 'Corporate Gifts', href: '/categories/corporate' },
      ],
    },
    {
      label: 'Categories',
      icon: <Grid3x3 className="w-5 h-5" />,
      children: [
        { label: 'Birthday Gifts', href: '/categories/birthday' },
        { label: 'Jewelry', href: '/categories/jewelry' },
        { label: 'Bags', href: '/categories/bags' },
        { label: 'Plushies', href: '/categories/plushies' },
      ],
    },
    {
      label: 'About',
      href: '/about',
    },
    {
      label: 'Contact',
      href: '/',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      label: 'Help Center',
      href: '/help',
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ],
  logo,
  companyName = 'Gifts & Goodies',
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              {logo ? (
                <img
                  src={logo}
                  alt={companyName}
                  className="h-10 sm:h-12 w-auto"
                />
              ) : (
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-linear-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-xl">G</span>
                </div>
              )}
              <span className="font-bold text-purple-600 text-lg sm:text-2xl group-hover:text-purple-700 transition-colors">
                {companyName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center px-8">
              {navItems.map((item) => (
                <div key={item.label} className="relative group">
                  {item.children ? (
                    <>
                      <button
                        className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 flex items-center space-x-2 group"
                        aria-expanded={false}
                        aria-haspopup="true"
                      >
                        {item.icon && <span className="text-gray-700 group-hover:text-purple-600">{item.icon}</span>}
                        <span>{item.label}</span>
                        <ChevronDown className="w-4 h-4 group-hover:text-purple-600 transition-transform duration-200 group-hover:rotate-180" />
                      </button>

                      <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 border border-purple-100 overflow-hidden">
                        <div className="px-4 py-2 bg-linear-to-r from-purple-50 to-purple-100 border-b border-purple-100">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                            {item.label}
                          </p>
                        </div>
                        <div className="py-1">
                          {item.children.map((child, index) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-150 text-sm font-medium group/item"
                            >
                              <span className="flex items-center justify-between">
                                <span>{child.label}</span>
                                <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-purple-600">
                                  →
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 flex items-center space-x-2"
                    >
                      {item.icon && <span className="text-gray-700 hover:text-purple-600">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <SearchBar placeholder="Search gifts..." />

              <button
                className="p-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 hidden sm:block"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>

              <Link
                href="/cart"
                className="p-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 relative"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full"></span>
              </Link>

              <div className="hidden md:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="small">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="small">
                    Sign Up
                  </Button>
                </Link>
              </div>

              <button
                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      
      <div
        className={`fixed inset-0 z-30 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      <nav
        className={`fixed top-16 left-0 right-0 bottom-0 z-30 md:hidden bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ maxWidth: '100%', width: '100%' }}
      >
        <div className="p-4 pt-10 space-y-2">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openDropdown === item.label ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="pl-4 space-y-1 pt-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-150"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="block px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

         
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 flex flex-col">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
              <Button variant="outline" size="medium" fullWidth>
                Login
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
              <Button variant="primary" size="medium" fullWidth>
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
