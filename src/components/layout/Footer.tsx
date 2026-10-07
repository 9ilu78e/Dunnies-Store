"use client";

import Link from "next/link";
import { useState } from "react";
import { useSiteSettings } from "./SiteSettingsProvider";
import { getWhatsAppContactLink } from "@/lib/whatsapp";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export default function Footer() {
  const { storeName, supportEmail, supportPhone, address } = useSiteSettings();
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || supportPhone;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setSubscriptionMessage("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to subscribe right now.");
      }
      setSubscriptionMessage(result.message);
      setEmail("");
    } catch (error) {
      setSubscriptionMessage(
        error instanceof Error ? error.message : "Unable to subscribe right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-2xl font-black mb-2 bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {storeName}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Your home for thoughtful gifts and memorable souvenirs,
                carefully chosen to help celebrate the moments that matter
                across Nigeria.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-sm">{address}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-violet-400 shrink-0" />
                <a href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`} className="text-sm hover:text-violet-400">
                  {supportPhone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-violet-400 shrink-0" />
                <a href={`mailto:${supportEmail}`} className="text-sm hover:text-violet-400">
                  {supportEmail}
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="https://facebook.com"
                className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-linear-to-r hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://twitter.com"
                className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-linear-to-r hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 hover:scale-110"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="https://instagram.com"
                className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-linear-to-r hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://youtube.com"
                className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-linear-to-r hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 hover:scale-110"
              >
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6 relative inline-block">
              Quick Links
              <span className="absolute bottom-0 left-0 w-8 h-1 bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full"></span>
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/live-chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Live Chat
                </Link>
              </li>
              <li>
                <a
                  href={getWhatsAppContactLink(whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  WhatsApp Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6 relative inline-block">
              Shop
              <span className="absolute bottom-0 left-0 w-8 h-1 bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full"></span>
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/product"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/gift"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Gifts Packages
                </Link>
              </li>
              <li>
                <Link
                  href="/product?categoryName=Birthday%20Gifts"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Birthday Gifts
                </Link>
              </li>
              <li>
                <Link
                  href="/product?categoryName=Ramadan%20Packages"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Ramadan Packages
                </Link>
              </li>
              <li>
                <Link
                  href="/product?categoryName=Eid%20al-Fitr%20Packages"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Eid al-Fitr Packages
                </Link>
              </li>
              <li>
                <Link
                  href="/product?categoryName=Gifts%20for%20Him"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Gifts for Him
                </Link>
              </li>
              <li>
                <Link
                  href="/product?categoryName=Gifts%20for%20Her"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Gifts for Her
                </Link>
              </li>
              <li>
                <Link
                  href="/product?categoryName=Corporate%20Gifts"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Corporate Gifts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-6 relative inline-block">
              Support
              <span className="absolute bottom-0 left-0 w-8 h-1 bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full"></span>
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/returns"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Return Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="hover:text-violet-400 transition-colors hover:translate-x-1 inline-block"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-3 sm:p-4 md:p-6 mb-10 backdrop-blur-sm border border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="text-center sm:text-left">
              <h5 className="text-white font-bold text-base sm:text-lg md:text-xl mb-1">
                Subscribe to Our Newsletter
              </h5>
              <p className="text-xs sm:text-sm text-gray-400">
                Get exclusive deals and updates delivered to your inbox
              </p>
            </div>

            {/* Mobile (xs to sm): Full width with icon inside */}
            <form onSubmit={handleSubscribe} className="sm:hidden w-full">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 pr-12 rounded-lg text-sm bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
                  aria-label="Subscribe"
                >
                  <Send className="w-4 h-4 text-violet-400" />
                </button>
              </div>
            </form>

            {/* Tablet (sm to md): Full width stacked */}
            <form
              onSubmit={handleSubscribe}
              className="hidden sm:flex md:hidden w-full flex-col gap-2"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2.5 text-sm bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Subscribing..." : "Subscribe"}</span>
              </button>
            </form>

            {/* Desktop (md and up): Side by side */}
            <form
              onSubmit={handleSubscribe}
              className="hidden md:flex gap-2 lg:gap-3"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 text-sm lg:text-base rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 lg:px-6 py-3 text-sm lg:text-base bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span className="hidden lg:inline">{submitting ? "Subscribing..." : "Subscribe"}</span>
              </button>
            </form>
            {subscriptionMessage && (
              <p role="status" className="text-center text-sm text-gray-200">
                {subscriptionMessage}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="text-sm text-gray-500">Secured Payment:</span>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <div className="bg-white px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-gray-900">
                    PAYSTACK
                  </span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-gray-900">
                    FLUTTERWAVE
                  </span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-blue-900">VISA</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-red-600">
                    MASTERCARD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
