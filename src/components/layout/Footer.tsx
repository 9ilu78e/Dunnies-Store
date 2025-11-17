export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">About Us</h3>
            <p className="text-gray-400">Quality products for everyone</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="text-gray-400 space-y-2">
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Follow</h3>
            <p className="text-gray-400">Social media links</p>
          </div>
        </div>
        <hr className="border-gray-700 my-8" />
        <p className="text-center text-gray-400">&copy; 2025 Dunnies Store. All rights reserved.</p>
      </div>
    </footer>
  )
}
