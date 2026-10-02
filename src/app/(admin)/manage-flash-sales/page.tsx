"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Clock3, Save, Trash2 } from "lucide-react";
import Loader from "@/components/ui/Loader";

type FlashSaleProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  flashSalePrice: number | null;
  flashSaleEndsAt: string | null;
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function ManageFlashSalesPage() {
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/flash-sales", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load products");
      }

      const items = data.products as FlashSaleProduct[];
      setProducts(items);
      setPrices(
        Object.fromEntries(
          items.map((product) => [
            product.id,
            product.flashSalePrice?.toString() || "",
          ])
        )
      );
      if (selectedIds.length === 0) {
        const activeProducts = items.filter(
          (product) => product.flashSalePrice !== null
        );
        setSelectedIds(activeProducts.map((product) => product.id));
        setEndsAt(toLocalDateTime(activeProducts[0]?.flashSaleEndsAt || null));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const toggleSelection = (productId: string) => {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const saveSelected = async () => {
    const selectedProducts = products.filter((product) =>
      selectedIds.includes(product.id)
    );
    if (selectedProducts.length === 0) {
      setError("Select at least one product for the flash sale.");
      return;
    }
    if (!endsAt || !Number.isFinite(Date.parse(endsAt))) {
      setError("Choose one shared end time for the selected products.");
      return;
    }
    if (Date.parse(endsAt) <= Date.now()) {
      setError("The shared end time must be in the future.");
      return;
    }

    const items = selectedProducts.map((product) => ({
      id: product.id,
      flashSalePrice: Number(prices[product.id]),
    }));
    if (
      items.some(
        (item) =>
          !Number.isFinite(item.flashSalePrice) ||
          item.flashSalePrice <= 0 ||
          item.flashSalePrice >=
            (selectedProducts.find((product) => product.id === item.id)
              ?.price ?? 0)
      )
    ) {
      setError(
        "Enter a valid sale price below the regular price for each selected product."
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/flash-sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedIds,
          items,
          flashSaleEndsAt: new Date(endsAt).toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to save flash sales");
      }

      setSuccess(`Flash sale saved for ${selectedProducts.length} product(s).`);
      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save flash sales"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    const selectedSaleIds = products
      .filter(
        (product) =>
          selectedIds.includes(product.id) && product.flashSalePrice !== null
      )
      .map((product) => product.id);
    if (selectedSaleIds.length === 0) {
      setError("Select at least one product that already has a flash sale.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/flash-sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedSaleIds, clear: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to remove flash sales");
      }

      setSuccess(
        `Flash sale removed from ${selectedSaleIds.length} product(s).`
      );
      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove flash sales"
      );
    } finally {
      setSaving(false);
    }
  };

  const allSelected =
    products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-purple-700 via-fuchsia-600 to-pink-500 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/15 p-3">
            <BadgePercent className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-100">
              Promotions
            </p>
            <h1 className="mt-1 text-3xl font-bold">Manage Flash Sales</h1>
            <p className="mt-2 max-w-2xl text-purple-100">
              Select multiple products, set each sale price, and give them all
              one shared end time.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-xl bg-green-50 p-4 text-sm text-green-700"
        >
          {success}
        </p>
      )}

      {loading ? (
        <Loader text="Loading products..." />
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-purple-100 bg-white p-10 text-center text-gray-600">
          Add products before setting up a flash sale.
        </div>
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:p-6">
            <label className="block max-w-sm text-sm font-semibold text-gray-700">
              Shared sale end time
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <p className="mr-auto text-sm text-gray-600">
                {selectedIds.length} product(s) selected
              </p>
              <button
                type="button"
                onClick={saveSelected}
                disabled={saving || selectedIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save selected sales"}
              </button>
              <button
                type="button"
                onClick={removeSelected}
                disabled={saving || selectedIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Remove selected sales
              </button>
            </div>
          </section>

          <div className="flex items-center gap-2">
            <input
              id="select-all-flash-sales"
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelectedIds(allSelected ? [] : products.map(({ id }) => id))
              }
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="select-all-flash-sales"
              className="text-sm font-medium text-gray-700"
            >
              Select all products
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const selected = selectedIds.includes(product.id);
              const hasSale =
                product.flashSalePrice !== null &&
                product.flashSaleEndsAt !== null;

              return (
                <article
                  key={product.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                    selected
                      ? "border-purple-400 ring-1 ring-purple-200"
                      : "border-gray-200"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelection(product.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-16 w-16 rounded-xl bg-purple-50 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-50 text-purple-300">
                        <BadgePercent className="h-6 w-6" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-2 font-bold text-gray-900">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        Regular: ₦{product.price.toLocaleString()}
                      </span>
                      {hasSale && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-fuchsia-700">
                          <Clock3 className="h-3.5 w-3.5" />
                          Current sale ends{" "}
                          {new Date(product.flashSaleEndsAt!).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </label>
                  <div className="border-t border-gray-100 p-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Sale price
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          ₦
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          max={product.price - 0.01}
                          step="0.01"
                          value={prices[product.id] || ""}
                          onChange={(event) =>
                            setPrices((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                          disabled={!selected}
                          placeholder="Enter a lower price"
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-8 pr-3 focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </div>
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
