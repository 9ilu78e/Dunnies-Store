import { Users, Target, Award, Heart } from "lucide-react";

const stats = [
  { icon: Users, label: "Happy Customers", value: "10,000+" },
  { icon: Award, label: "Products Sold", value: "50,000+" },
  { icon: Target, label: "Years in Business", value: "5+" },
  { icon: Heart, label: "Customer Satisfaction", value: "98%" },
];

const values = [
  {
    icon: Heart,
    title: "Customer First",
    description:
      "We prioritize your satisfaction above everything else. Every decision we make is centered around providing you with the best shopping experience.",
  },
  {
    icon: Award,
    title: "Quality Products",
    description:
      "We carefully select and curate only premium quality products that meet our high standards and your expectations.",
  },
  {
    icon: Target,
    title: "Fast Delivery",
    description:
      "Your time matters to us. We ensure swift and reliable delivery across Nigeria, getting your orders to you when you need them.",
  },
  {
    icon: Users,
    title: "Community Focus",
    description:
      "We are more than a store - we are part of the Nigerian community, supporting local businesses and giving back to society.",
  },
];

export default function AboutPage() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
            ABOUT DUNNI STORES
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-6">
            Your Trusted Shopping Partner in Nigeria
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Founded in 2020, Dunni Stores has grown to become one of Nigeria's
            most trusted online marketplaces. We are committed to providing
            quality products, exceptional service, and a seamless shopping
            experience for every Nigerian family.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <stat.icon className="w-12 h-12 text-violet-600 mx-auto mb-4" />
              <div className="text-2xl font-black text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Dunni Stores was born from a simple vision: to make quality
              shopping accessible to every Nigerian household. Our founder,
              Adunni Oluwaseun, noticed the challenges many Nigerians faced when
              trying to find reliable, quality products online.
            </p>
            <p>
              Starting from a small warehouse in Lagos, we've grown into a
              trusted name across Nigeria. We work directly with manufacturers
              and verified suppliers to ensure every product meets our strict
              quality standards. From fresh groceries to premium gifts,
              electronics to fashion, we've carefully curated our selection to
              serve the diverse needs of Nigerian families.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
