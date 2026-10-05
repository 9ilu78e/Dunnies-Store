export const metadata = {
  title: "Blog | Dunnis Stores",
  description: "Gift inspiration and updates from Dunnis Stores.",
};

const articles = [
  {
    title: "Choosing a thoughtful birthday gift",
    description:
      "Start with the recipient’s interests, then choose something useful or personal that suits the occasion.",
  },
  {
    title: "A simple guide to corporate gifting",
    description:
      "Consider the audience, the moment, and a practical presentation when selecting gifts for clients or teams.",
  },
  {
    title: "Make every celebration feel personal",
    description:
      "A short handwritten note and a gift chosen with care can make even a small celebration memorable.",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="font-semibold uppercase tracking-wide text-purple-700">
          Ideas and inspiration
        </p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          The Dunnis Stores Blog
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          Gift ideas, celebration inspiration, and updates from our store.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.title}
              className="rounded-2xl border border-gray-200 p-5"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {article.title}
              </h2>
              <p className="mt-3 text-gray-600">{article.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
