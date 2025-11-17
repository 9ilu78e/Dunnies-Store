import { Truck, Shield, Award, Clock } from "lucide-react";

export default function FeaturesBar() {
  return (
    <section className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Truck,
              title: "Free Delivery",
              desc: "Orders over ₦50,000",
            },
            {
              icon: Shield,
              title: "Secure Payment",
              desc: "100% protected transactions",
            },
            {
              icon: Award,
              title: "Premium Quality",
              desc: "Handpicked best products",
            },
            {
              icon: Clock,
              title: "24/7 Support",
              desc: "We're always here for you",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 group hover:scale-105 transition-all duration-300"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                <div className="relative w-14 h-14 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{item.title}</h3>
                <p className="text-purple-100 text-sm mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
