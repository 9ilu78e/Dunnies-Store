export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 uppercase tracking-widest">
          Editing product
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          {id.replace(/-/g, " ")}
        </h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl">
        <form className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Product name
              </label>
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 mt-1 p-3 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Price (₦)
              </label>
              <input
                type="number"
                className="w-full rounded-2xl border border-gray-200 mt-1 p-3 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full rounded-2xl border border-gray-200 mt-1 p-3 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Category
              </label>
              <select className="w-full rounded-2xl border border-gray-200 mt-1 p-3 focus:border-purple-500 focus:outline-none">
                <option>Gifts</option>
                <option>Groceries</option>
                <option>Home</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Inventory
              </label>
              <input
                type="number"
                className="w-full rounded-2xl border border-gray-200 mt-1 p-3 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-purple-600 text-white px-6 py-3 font-semibold hover:bg-purple-700 transition">
              Save changes
            </button>
            <button className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Preview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
