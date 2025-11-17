import Link from 'next/link'

interface Product {
  id: number
  name: string
  price: number
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition">
      <div className="bg-gray-200 h-48 rounded-t-lg"></div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-4">${product.price}</p>
        <Link href={`/product/${product.id}`} className="text-blue-600 hover:text-blue-800">
          View Details →
        </Link>
      </div>
    </div>
  )
}
