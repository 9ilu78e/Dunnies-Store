export default function ProductDetail({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Product {params.id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">Product details</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Add to Cart
        </button>
      </div>
    </div>
  )
}
