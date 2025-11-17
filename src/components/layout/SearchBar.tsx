'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search for gifts...',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && query.trim()) {
      onSearch(query)
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={searchRef} className="relative">
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 shrink-0"
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      
      {isOpen && (
        <>
          
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          
          <div className="hidden md:block absolute top-12 -right-2 z-50 w-96">
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 space-x-2">
                <Search className="w-5 h-5 text-purple-600 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500 font-medium"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 hover:text-purple-600 transition-colors text-gray-500 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shrink-0"
                >
                  Go
                </button>
              </div>
            </form>

            
            {query && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-purple-100 overflow-hidden z-50">
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Suggestions:</p>
                  <ul className="space-y-2">
                    {['Birthday Gifts', 'Jewelry', 'Bags', 'Plushies'].map((suggestion) => (
                      <li key={suggestion}>
                        <button
                          onClick={() => {
                            setQuery(suggestion)
                            if (onSearch) onSearch(suggestion)
                            setIsOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          
          <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col pt-20 px-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center space-x-2 bg-purple-50 rounded-xl px-4 py-3 border-2 border-purple-200">
                <Search className="w-5 h-5 text-purple-600 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500 font-medium"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-gray-500 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </form>

            
            {query && (
              <div className="mt-8">
                <p className="text-sm text-gray-600 mb-4 font-semibold">Suggestions:</p>
                <ul className="space-y-2">
                  {['Birthday Gifts', 'Jewelry', 'Bags', 'Plushies'].map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        onClick={() => {
                          setQuery(suggestion)
                          if (onSearch) onSearch(suggestion)
                          setIsOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors font-medium"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
