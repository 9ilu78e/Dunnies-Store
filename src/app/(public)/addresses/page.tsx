"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Edit2, Home, MapPin, Plus, Trash2 } from "lucide-react";

type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

type AddressForm = Omit<SavedAddress, "id" | "isDefault"> & {
  id?: string;
  isDefault: boolean;
};

const EMPTY_FORM: AddressForm = {
  label: "",
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "Nigeria",
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AddressForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/addresses", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/login?from=addresses");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Unable to load addresses.");
      setAddresses(data.addresses || []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
        form?.id ? `/api/addresses/${form.id}` : "/api/addresses",
        {
          method: form?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save address.");
      setForm(null);
      await loadAddresses();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save address.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (address: SavedAddress) => {
    if (!window.confirm(`Delete the ${address.label} address?`)) return;
    try {
      const response = await fetch(`/api/addresses/${address.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete address.");
      await loadAddresses();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete address.");
    }
  };

  return (
    <section className="bg-gray-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-600">
              Delivery Details
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-4xl">Saved delivery details</h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Choose a saved delivery address at checkout, or enter a different one.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY_FORM })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add delivery details
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {form && (
          <form onSubmit={saveAddress} className="grid gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:gap-4 sm:rounded-3xl sm:p-6 md:grid-cols-2">
            <h2 className="text-xl font-bold text-gray-900 md:col-span-2">
              {form.id ? "Edit address" : "Add an address"}
            </h2>
            {([
              ["label", "Address label (Home, Office…)"],
              ["recipient", "Recipient name"],
              ["phone", "Phone number"],
              ["line1", "Street address"],
              ["line2", "Apartment, suite, landmark (optional)"],
              ["city", "City"],
              ["region", "State / region"],
              ["postalCode", "Postal code"],
              ["country", "Country"],
            ] as const).map(([key, placeholder]) => (
              <input
                key={key}
                required={["label", "recipient", "phone", "line1", "city", "country"].includes(key)}
                value={form[key] || ""}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, [key]: event.target.value } : current
                  )
                }
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, isDefault: event.target.checked } : current
                  )
                }
              />
              Set as my default delivery address
            </label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-purple-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save address"}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-full border border-gray-300 px-5 py-2.5 font-semibold text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600 sm:rounded-3xl sm:p-10">
            Loading saved addresses...
          </p>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-6 text-center sm:rounded-3xl sm:p-10">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-purple-400" />
            <p className="font-semibold text-gray-900">No saved addresses yet</p>
            <p className="mt-1 text-sm text-gray-600">Add one to use it quickly at checkout.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {addresses.map((address) => {
              const Icon = /office|work/i.test(address.label) ? Building : Home;
              return (
                <article
                  key={address.id}
                  className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg sm:rounded-3xl sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{address.label}</p>
                        {address.isDefault && (
                          <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 text-gray-500">
                      <button
                        type="button"
                        aria-label={`Edit ${address.label} address`}
                        onClick={() => setForm({ ...address, isDefault: address.isDefault })}
                        className="hover:text-purple-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${address.label} address`}
                        onClick={() => void deleteAddress(address)}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-semibold">{address.recipient}</p>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                      {[address.city, address.region, address.postalCode, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-sm text-gray-500">{address.phone}</p>
                  </div>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        void fetch(`/api/addresses/${address.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          credentials: "same-origin",
                          body: JSON.stringify({ isDefault: true }),
                        }).then(async (response) => {
                          const data = await response.json();
                          if (!response.ok) throw new Error(data.error || "Unable to set default address.");
                          await loadAddresses();
                        }).catch((setDefaultError) => {
                          setError(setDefaultError instanceof Error ? setDefaultError.message : "Unable to set default address.");
                        })
                      }
                      className="self-start text-sm font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Set as default
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
