export default function ManageUsers() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Manage Users</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td colSpan={3} className="p-4 text-gray-600">No users yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
