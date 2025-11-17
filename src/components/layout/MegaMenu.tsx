'use client'

interface MegaMenuProps {
  title: string
  items: Array<{
    label: string
    href: string
    icon?: React.ReactNode
    description?: string
  }>
  columns?: number
}

export default function MegaMenu({
  title,
  items,
  columns = 4,
}: MegaMenuProps) {
  return (
    <div className="absolute left-0 mt-0 w-full bg-white rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-100 p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className={`grid grid-cols-${columns} gap-6`}>
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="group/item p-3 rounded-lg hover:bg-purple-50 transition-colors duration-150"
          >
            {item.icon && <div className="mb-3">{item.icon}</div>}
            <p className="font-medium text-gray-900 group-hover/item:text-purple-600 transition-colors">
              {item.label}
            </p>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
