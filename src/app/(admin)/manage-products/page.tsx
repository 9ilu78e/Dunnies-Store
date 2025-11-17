export default function ManageProducts() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Product
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td colSpan={3} className="p-4 text-gray-600">No products yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
