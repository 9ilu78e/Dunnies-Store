"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  Headphones,
  Facebook,
  Twitter,
  Instagram,
  CheckCircle,
} from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Our Office",
    details: ["4th Floor, Area 11", "Garki, Abuja, Nigeria", "900100"],
  },
  {
    icon: Phone,
    title: "Call Us",
    details: ["+234 901 987 6543", "Mon-Sat: 9am - 7pm"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["support@dunnistores.ng", "Response within 12hrs"],
  },
  {
    icon: Clock,
    title: "Business Hours",
    details: ["Monday - Friday: 9am - 7pm", "Saturday: 10am - 4pm"],
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (
      formData.name &&
      formData.email &&
      formData.subject &&
      formData.message
    ) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }, 3000);
    }
  };
  const abujaMapEmbedUrl =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.3533664720173!2d7.478988674984576!3d9.068361590977372!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104e0b57e79393e1%3A0x6335193911531e21!2sAbuja%20National%20Mosque!5e0!3m2!1sen!2sng!4v1700208000000!5m2!1sen!2sng";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-bold mb-3">
              GET IN TOUCH
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              We'd Love to Hear From You
            </h1>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Our dedicated team in Abuja is here to help you every step of the
              way.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-gray-600 text-xs">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-6 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-3">Connect With Us</h3>
                <div className="flex gap-3">
                  <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all">
                    <Facebook className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all">
                    <Instagram className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-all">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-xl">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We'll get back to you within 12 hours.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Headphones className="w-6 h-6 text-violet-600" />
                    Send Us a Message
                  </h2>
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:outline-none text-sm"
                      placeholder="Full Name *"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:outline-none text-sm"
                      placeholder="Email Address *"
                    />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:outline-none text-sm"
                      placeholder="Subject *"
                    />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:outline-none resize-none text-sm"
                      placeholder="Your Message *"
                    />
                    <button
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-2 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 p-4 border-b text-center">
              Our Location in Abuja
            </h2>
            <div className="aspect-video">
              <iframe
                src={abujaMapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Dunni Stores Abuja Location"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
