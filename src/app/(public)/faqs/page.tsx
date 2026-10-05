import Link from "next/link";

export const metadata = {
  title: "FAQs | Dunnis Stores",
  description: "Answers to common Dunnis Stores shopping and order questions.",
};

const questions = [
  {
    question: "How do I place an order?",
    answer:
      "Add the items you want to your cart, continue to checkout, and provide your delivery details and payment information.",
  },
  {
    question: "Can I save my delivery details?",
    answer:
      "Yes. Add delivery details to your profile and they will be available to select during checkout.",
  },
  {
    question: "How can I check my order status?",
    answer:
      "Sign in and open your orders page to see the latest status and order details.",
  },
  {
    question: "What if my order arrives damaged or incorrect?",
    answer:
      "Contact support with your order number and a description or photos of the issue. See our Return Policy for more information.",
  },
  {
    question: "How do I subscribe to store updates?",
    answer:
      "Enter your email in the newsletter form on this page. Store newsletters are sent only to subscribed email addresses.",
  },
];

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold uppercase tracking-wide text-purple-700">
          Help center
        </p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Frequently Asked Questions
        </h1>
        <div className="mt-8 divide-y divide-gray-200">
          {questions.map(({ question, answer }) => (
            <section key={question} className="py-5">
              <h2 className="text-xl font-semibold text-gray-900">{question}</h2>
              <p className="mt-2 text-gray-600">{answer}</p>
            </section>
          ))}
        </div>
        <p className="mt-6 text-gray-600">
          Still need help?{" "}
          <Link href="/contact" className="font-semibold text-purple-700 underline">
            Contact our team
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
