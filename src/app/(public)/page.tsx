import ProductList from '@/components/product/ProductList'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Dunnies Store</h1>
      <ProductList />
    </div>
  )
}
