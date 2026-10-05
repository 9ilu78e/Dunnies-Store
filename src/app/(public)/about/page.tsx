import Link from "next/link";
import { ArrowRight, Users, Award, Heart } from "lucide-react";

const stats = [
  { label: "Happy customers", value: "10,000+" },
  { label: "Products sold", value: "50,000+" },
  { label: "Years in business", value: "5+" },
  { label: "Customer satisfaction", value: "98%" },
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
    icon: Users,
    title: "Community Focus",
    description:
      "We are more than a store - we are part of the Nigerian community, supporting local businesses and giving back to society.",
  },
];

const timeline = [
  { when: "2020", text: "Founded from a small warehouse in Lagos." },
  { when: "Today", text: "A trusted name for families across Nigeria." },
];

export default function AboutPage() {
  return (
    <section className="overflow-x-hidden bg-white py-4 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="rounded-3xl bg-linear-to-br from-violet-950 via-violet-900 to-violet-800 p-6 text-white sm:p-10 lg:p-16">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100 sm:text-sm">
            About Dunni Stores
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight break-words sm:mt-6 sm:text-5xl lg:text-6xl">
            Your trusted shopping partner in Nigeria
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-violet-100 sm:mt-6 sm:text-lg">
            Founded in 2020, Dunni Stores has grown to become one of Nigeria's
            most trusted online marketplaces. We are committed to providing
            quality products, exceptional service, and a seamless shopping
            experience for every Nigerian family.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/15 pt-8 sm:mt-12 sm:pt-10 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <dt className="text-xs font-medium text-violet-200 sm:text-sm">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-2xl font-black tracking-tight break-words sm:text-4xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Story */}
        <div className="grid gap-8 py-12 sm:py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Our Story
            </h2>
            <p className="mt-4 text-xl font-bold leading-snug text-violet-700 sm:text-2xl">
              Quality shopping, within reach of every Nigerian household.
            </p>

            <ol className="mt-8 space-y-5 border-l-2 border-violet-200 pl-5">
              {timeline.map((item) => (
                <li key={item.when} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 ring-4 ring-white" />
                  <p className="text-sm font-bold text-gray-900">{item.when}</p>
                  <p className="text-sm text-gray-600">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-gray-700 sm:text-base lg:col-span-7 lg:text-lg">
            <p>
              Dunni Stores was born from a simple vision: to make quality
              shopping accessible to every Nigerian household. Our founder,
              Adunni Oluwaseun, noticed the challenges many Nigerians faced when
              trying to find reliable, quality products online.
            </p>
            <p>
              Starting from a small warehouse in Lagos, we've grown into a
              trusted name across Nigeria. We work with carefully selected
              makers and suppliers to bring customers meaningful souvenirs,
              locally inspired keepsakes, and thoughtful gifts for the moments
              worth remembering.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="border-t border-gray-200 pt-12 sm:pt-16">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Our Core Values
          </h2>
          <div className="mt-8 grid grid-cols-1 divide-y divide-gray-200 sm:mt-10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {values.map((value) => (
              <div
                key={value.title}
                className="min-w-0 py-6 first:pt-0 last:pb-0 md:px-8 md:py-2 md:first:pl-0 md:last:pr-0"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-700 sm:h-12 sm:w-12">
                  <value.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-gray-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing call to action */}
        <div className="mt-14 flex flex-col gap-6 rounded-3xl bg-violet-50 p-6 sm:mt-20 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12">
          <div className="max-w-xl">
            <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Find something worth remembering
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Browse gifts, keepsakes and souvenirs from the full collection.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/product"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 font-bold text-white transition hover:shadow-lg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Shop the collection
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border-2 border-violet-200 bg-white px-6 py-3 font-bold text-violet-700 transition hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}