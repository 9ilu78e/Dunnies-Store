"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Gift,
  ArrowRight,
} from "lucide-react";

const faqs = [
  {
    title: "Where is my order?",
    body: "Head to My Orders to view statuses, delivery ETAs, and tracking numbers updated in real time.",
    href: "/orders",
  },
  {
    title: "How do returns work?",
    body: "Most items are eligible for returns within 7 days of delivery. Start a return and schedule a pickup instantly.",
    href: "/contact",
  },
  {
    title: "Can I edit my order?",
    body: "You can tweak delivery addresses, gift notes, or cancel items before they ship. Chat with concierge for urgent updates.",
    href: "/contact",
  },
];

const contactOptions = [
  {
    title: "Live chat",
    description: "Available every day, 7am–11pm WAT.",
    icon: MessageCircle,
    href: "/contact",
    cta: "Start chat",
  },
  {
    title: "Call support",
    description: "Prefer a human voice? We’ve got you.",
    icon: Phone,
    href: "tel:+2348000000000",
    cta: "Call now",
  },
  {
    title: "Email concierge",
    description: "Detailed inquiries and partnerships.",
    icon: Mail,
    href: "mailto:support@dunnis.store",
    cta: "Send email",
  },
];

const helpTopics = [
  {
    title: "Shipping & tracking",
    description: "Timelines, carriers, insurance, and SMS updates.",
    icon: Truck,
  },
  {
    title: "Payments & wallet",
    description: "Cards, transfers, pay-later, and refunds.",
    icon: ShieldCheck,
  },
  {
    title: "Returns & exchanges",
    description: "Schedule pickups, label printing, and store credit.",
    icon: RefreshCcw,
  },
  {
    title: "Gifting services",
    description: "Gift wrap, handwritten cards, and surprise deliveries.",
    icon: Gift,
  },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");

  return (
    <section className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="rounded-3xl bg-linear-to-r from-purple-600 to-pink-600 text-white p-10 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/70 mb-2">
                Help center
              </p>
              <h1 className="text-3xl font-bold mb-3">How can we help?</h1>
              <p className="text-base text-white/90">
                Search quick answers, browse step-by-steps, or reach our concierge team
                any time—whatever suits you best.
              </p>
            </div>
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders, payments, returns..."
                className="w-full rounded-2xl bg-white/20 border border-white/40 text-white placeholder:text-white/70 py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {helpTopics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-lg transition"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-600">
                  <topic.icon className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 mt-2">{topic.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
                FAQs
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                Popular questions
              </h2>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 px-5 py-2 text-purple-700 font-semibold hover:bg-purple-50 transition"
            >
              Still stuck? Contact us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.title}
                className="rounded-2xl border border-gray-200 p-5 hover:border-purple-200 transition bg-gray-50/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {faq.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{faq.body}</p>
                  </div>
                  <Link
                    href={faq.href}
                    className="text-sm font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                  >
                    Open <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {contactOptions.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-lg transition flex flex-col"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-4">
                <option.icon className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-semibold text-gray-900">
                {option.title}
              </h3>
              <p className="text-gray-600 mt-2 flex-1">{option.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
                {option.cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

