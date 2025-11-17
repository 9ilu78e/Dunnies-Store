export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-700">Products</h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-700">Orders</h2>
          <p className="text-4xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-700">Users</h2>
          <p className="text-4xl font-bold text-purple-600 mt-2">0</p>
        </div>
      </div>
    </div>
  )
}
