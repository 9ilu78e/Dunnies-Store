export default function ManageOrders() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Manage Orders</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Order ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td colSpan={4} className="p-4 text-gray-600">No orders yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
