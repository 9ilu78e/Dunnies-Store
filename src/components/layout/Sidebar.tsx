import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-6 sticky top-0">
      <h2 className="text-xl font-bold mb-8 text-blue-400">Admin Panel</h2>
      <nav className="space-y-4">
        <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
          Dashboard
        </Link>
        <Link href="/admin/manage-products" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
          Products
        </Link>
        <Link href="/admin/manage-orders" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
          Orders
        </Link>
        <Link href="/admin/manage-users" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
          Users
        </Link>
      </nav>
    </aside>
  )
}
