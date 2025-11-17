export default function EditProduct({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product {params.id}</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
        <form className="space-y-4">
          <input type="text" placeholder="Product Name" className="w-full border p-2 rounded" />
          <input type="number" placeholder="Price" className="w-full border p-2 rounded" />
          <textarea placeholder="Description" className="w-full border p-2 rounded"></textarea>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Save Product
          </button>
        </form>
      </div>
    </div>
  )
}
