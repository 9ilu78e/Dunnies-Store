export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
        <form className="space-y-4">
          <input type="text" placeholder="Full Name" className="w-full border p-2 rounded" />
          <input type="email" placeholder="Email" className="w-full border p-2 rounded" />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Complete Purchase
          </button>
        </form>
      </div>
    </div>
  )
}
