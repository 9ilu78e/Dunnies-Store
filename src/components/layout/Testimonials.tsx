import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Fatima Abubakar",
    role: "Lagos Shopper",
    content:
      "This store has been a blessing for my family! The Islamic gifts collection is beautiful and authentic. I ordered gifts for Ramadan and they arrived perfectly packaged with extra care.",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1583341612074-ccea5cd64f6a?w=100&q=80",
  },
  {
    name: "Aisha Muhammad",
    role: "Regular Customer",
    content:
      "As a Muslim woman, I appreciate the modest and elegant gift options available. The hijabs and Islamic decor items are of premium quality. Highly recommend for Eid gifts!",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80",
  },
  {
    name: "Emeka Nwosu",
    role: "Gift Enthusiast",
    content:
      "The best online shopping experience in Nigeria! From traditional gifts to modern items, they have everything. Delivery to Abuja was quick and the packaging was impressive.",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-linear-to-b from-violet-50 via-white to-violet-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-7xl mx-auto">
          <div className="inline-block bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
            CUSTOMER REVIEWS
          </div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of families across Nigeria
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, index) => (
            <div
              key={t.name}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-violet-200 hover:-translate-y-2 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-violet-100 to-purple-100 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

              <Quote className="w-10 h-10 text-violet-200 mb-4 relative z-10" />

              <div className="flex items-center gap-1 mb-4 relative z-10">
                {[...Array(t.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed text-base relative z-10 italic">
                "{t.content}"
              </p>

              <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-linear-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{t.name}</h4>
                  <p className="text-sm text-violet-600 font-semibold">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex flex-wrap justify-center items-center gap-6 sm:gap-8 bg-white rounded-2xl px-6 sm:px-8 py-6 shadow-lg border border-gray-100 max-w-full">
            <div className="text-center min-w-[120px]">
              <div className="text-lg font-black text-violet-600">5,000+</div>
              <div className="text-sm text-gray-600 font-medium">
                Happy Customers
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block" />
            <div className="text-center min-w-[120px]">
              <div className="text-lg font-black text-violet-600">4.9★</div>
              <div className="text-sm text-gray-600 font-medium">
                Average Rating
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block" />
            <div className="text-center min-w-[120px]">
              <div className="text-lg font-black text-violet-600">10,000+</div>
              <div className="text-sm text-gray-600 font-medium">
                Orders Delivered
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
