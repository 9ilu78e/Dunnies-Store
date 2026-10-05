"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Save, Trash2, Upload } from "lucide-react";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/site-settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load website settings.");
        }
        if (active) setSettings({ ...DEFAULT_SITE_SETTINGS, ...data });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load website settings."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (field: keyof Omit<SiteSettings, "heroImages">, value: string) =>
    setSettings((current) => ({ ...current, [field]: value }));

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "branding");
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Unable to upload ${file.name}.`);
      }
      if (typeof data.url !== "string") {
        throw new Error("Logo upload did not return an image URL.");
      }
      setSettings((current) => ({ ...current, headerLogo: data.url }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload header logo."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (settings.heroImages.length + files.length > 12) {
      setError("You can add up to 12 hero images.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "hero");
        const response = await fetch("/api/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Unable to upload ${file.name}.`);
        }
        if (typeof data.url !== "string") {
          throw new Error(`Upload did not return an image URL for ${file.name}.`);
        }
        setSettings((current) => ({
          ...current,
          heroImages: [...current.heroImages, data.url],
        }));
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload hero images."
      );
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/site-settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to save website settings.");
      }
      setSettings({ ...DEFAULT_SITE_SETTINGS, ...data });
      setMessage("Website settings saved.");
      window.dispatchEvent(new Event("dunnis:site-settings-changed"));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save website settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Loading website settings...
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
          Website settings
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage the contact details and hero images displayed across the storefront.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Storefront header branding</h2>
            <p className="text-sm text-gray-500">
              Update the name, tagline, logo, and text colors shown in the public header. The existing purple header styling remains unchanged by default.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Header name
              <input
                required
                maxLength={120}
                value={settings.storeName}
                onChange={(event) => update("storeName", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Header subtitle
              <input
                maxLength={80}
                value={settings.headerSubtitle}
                onChange={(event) => update("headerSubtitle", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Header name color
              <span className="mt-1 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <input
                  type="color"
                  aria-label="Header name color"
                  value={settings.headerTitleColor}
                  onChange={(event) => update("headerTitleColor", event.target.value)}
                  className="h-9 w-12 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-sm text-gray-600">{settings.headerTitleColor}</span>
              </span>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Header subtitle color
              <span className="mt-1 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <input
                  type="color"
                  aria-label="Header subtitle color"
                  value={settings.headerSubtitleColor}
                  onChange={(event) => update("headerSubtitleColor", event.target.value)}
                  className="h-9 w-12 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-sm text-gray-600">{settings.headerSubtitleColor}</span>
              </span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
              {settings.headerLogo ? (
                <Image src={settings.headerLogo} alt="Header logo preview" fill sizes="64px" className="object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">LOGO</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload header logo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                  disabled={uploading}
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
              </label>
              {settings.headerLogo && (
                <button
                  type="button"
                  onClick={() => setSettings((current) => ({ ...current, headerLogo: "" }))}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove logo
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Store details</h2>
            <p className="text-sm text-gray-500">These appear in the storefront footer and contact/support pages.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Support email
              <input
                required
                type="email"
                maxLength={254}
                value={settings.supportEmail}
                onChange={(event) => update("supportEmail", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Support phone
              <input
                required
                type="tel"
                maxLength={40}
                value={settings.supportPhone}
                onChange={(event) => update("supportPhone", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Address
            <input
              maxLength={240}
              value={settings.address}
              onChange={(event) => update("address", event.target.value)}
              className={inputClass}
            />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hero images</h2>
              <p className="text-sm text-gray-500">Upload up to 12 images for the homepage slider. Changes appear after saving.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload images"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                multiple
                disabled={uploading || settings.heroImages.length >= 12}
                onChange={handleUpload}
                className="sr-only"
              />
            </label>
          </div>
          {settings.heroImages.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {settings.heroImages.map((image, index) => (
                <div key={`${image}-${index}`} className="relative aspect-[3/2] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <Image src={image} alt={`Hero slide ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove hero image ${index + 1}`}
                    onClick={() => setSettings((current) => ({
                      ...current,
                      heroImages: current.heroImages.filter((_, imageIndex) => imageIndex !== index),
                    }))}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
              No hero images selected. Upload at least one image to show a homepage hero.
            </p>
          )}
        </section>

        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save website settings"}
        </button>
      </form>
    </div>
  );
}
