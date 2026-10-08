"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Save, Trash2, Upload } from "lucide-react";
import {
  DEFAULT_HERO_SLIDE,
  DEFAULT_SITE_SETTINGS,
  type HeroSlide,
  type SiteSettings,
} from "@/lib/siteSettings";

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<
    "branding" | "store" | "hero"
  >("branding");
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

  const update = (field: keyof Omit<SiteSettings, "heroSlides">, value: string) =>
    setSettings((current) => ({ ...current, [field]: value }));

  const updateHeroSlide = <K extends keyof HeroSlide>(
    index: number,
    field: K,
    value: HeroSlide[K]
  ) => {
    setSettings((current) => ({
      ...current,
      heroSlides: current.heroSlides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide
      ),
    }));
  };

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
    if (settings.heroSlides.length + files.length > 12) {
      setError("You can add up to 12 hero slides.");
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
          heroSlides: [
            ...current.heroSlides,
            { ...DEFAULT_HERO_SLIDE, image: data.url },
          ],
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

  const replaceHeroImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "hero");
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") {
        throw new Error(data.error || `Unable to upload ${file.name}.`);
      }
      updateHeroSlide(index, "image", data.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to replace the hero image."
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
    "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";
  const sections = [
    { id: "branding", label: "Header branding" },
    { id: "store", label: "Store details" },
    { id: "hero", label: "Hero images" },
  ] as const;

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] min-h-0 max-w-5xl flex-col gap-2.5 sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)]">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent">
            Website settings
          </h1>
          <p className="mt-0.5 text-sm text-gray-600">
          Manage the contact details and hero images displayed across the storefront.
          </p>
        </div>
        <button
          type="submit"
          form="website-settings-form"
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      {error && (
        <p role="alert" className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="shrink-0 rounded-lg border border-green-200 bg-green-50 p-2.5 text-sm text-green-700">
          {message}
        </p>
      )}

      <div className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Website settings sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeSection === section.id
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <form id="website-settings-form" onSubmit={saveSettings} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeSection === "branding" && (
        <section role="tabpanel" className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-gray-900">Storefront header branding</h2>
            <p className="text-xs text-gray-500">
              Update the name, tagline, logo, and text colors shown in the public header.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
              {settings.headerLogo ? (
                <Image src={settings.headerLogo} alt="Header logo preview" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">LOGO</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700">
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
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove logo
                </button>
              )}
            </div>
          </div>
        </section>
        )}

        {activeSection === "store" && (
        <section role="tabpanel" className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-gray-900">Store details</h2>
            <p className="text-xs text-gray-500">These appear in the storefront footer and contact/support pages.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
        )}

        {activeSection === "hero" && (
        <section role="tabpanel" className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Homepage hero slides</h2>
              <p className="text-xs text-gray-500">Edit the text, buttons, and uploaded image for each slide. Changes appear after saving.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Add hero slide"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
                multiple
                disabled={uploading || settings.heroSlides.length >= 12}
                onChange={handleUpload}
                className="sr-only"
              />
            </label>
          </div>
          {settings.heroSlides.length ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {settings.heroSlides.map((slide, index) => (
                <article
                  key={`${slide.image}-${index}`}
                  className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 lg:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <div>
                    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {slide.image.toLowerCase().split("?")[0].endsWith(".svg") ? (
                        <img
                          src={slide.image}
                          alt={`Hero slide ${index + 1} preview`}
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      ) : (
                        <Image
                          src={slide.image}
                          alt={`Hero slide ${index + 1} preview`}
                          fill
                          sizes="176px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100">
                        <Upload className="h-3.5 w-3.5" />
                        Replace image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
                          disabled={uploading}
                          onChange={(event) => void replaceHeroImage(event, index)}
                          className="sr-only"
                        />
                      </label>
                      <button
                        type="button"
                        aria-label={`Remove hero slide ${index + 1}`}
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            heroSlides: current.heroSlides.filter(
                              (_, slideIndex) => slideIndex !== index
                            ),
                          }))
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid content-start gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["alt", "Image description", 180],
                        ["tag", "Eyebrow text", 80],
                        ["title", "Heading", 160],
                        ["subtitle", "Subtitle", 200],
                        ["description", "Description", 500],
                        ["ctaText", "Primary button", 60],
                        ["ctaHref", "Primary button link", 512],
                        ["secondaryCtaText", "Secondary button", 60],
                        ["secondaryCtaHref", "Secondary button link", 512],
                      ] as const
                    ).map(([field, label, maxLength]) => (
                      <label
                        key={field}
                        className={`block text-xs font-medium text-gray-700 ${
                          field === "description" ? "sm:col-span-2" : ""
                        }`}
                      >
                        {label}
                        {field === "description" ? (
                          <textarea
                            maxLength={maxLength}
                            rows={2}
                            value={slide[field]}
                            onChange={(event) =>
                              updateHeroSlide(index, field, event.target.value)
                            }
                            className={`${inputClass} resize-y`}
                          />
                        ) : (
                          <input
                            maxLength={maxLength}
                            value={slide[field]}
                            onChange={(event) =>
                              updateHeroSlide(index, field, event.target.value)
                            }
                            className={inputClass}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 space-y-3 border-t border-gray-200 pt-3 lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      Slide design
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="block text-xs font-medium text-gray-700">
                        Text alignment
                        <select
                          value={slide.textAlignment}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "textAlignment",
                              event.target.value as HeroSlide["textAlignment"]
                            )
                          }
                          className={inputClass}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Content position
                        <select
                          value={slide.contentPosition}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "contentPosition",
                              event.target.value as HeroSlide["contentPosition"]
                            )
                          }
                          className={inputClass}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Image fit
                        <select
                          value={slide.imageFit}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "imageFit",
                              event.target.value as HeroSlide["imageFit"]
                            )
                          }
                          className={inputClass}
                        >
                          <option value="cover">Fill hero</option>
                          <option value="contain">Show full image</option>
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Hero height
                        <select
                          value={slide.heroHeight}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "heroHeight",
                              event.target.value as HeroSlide["heroHeight"]
                            )
                          }
                          className={inputClass}
                        >
                          <option value="compact">Compact</option>
                          <option value="standard">Standard</option>
                          <option value="tall">Tall</option>
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Corner rounding
                        <select
                          value={slide.cornerRadius}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "cornerRadius",
                              event.target.value as HeroSlide["cornerRadius"]
                            )
                          }
                          className={inputClass}
                        >
                          <option value="none">Square</option>
                          <option value="small">Subtle</option>
                          <option value="medium">Rounded</option>
                        </select>
                      </label>
                      {(
                        [
                          ["titleColor", "Heading color"],
                          ["subtitleColor", "Subtitle color"],
                          ["descriptionColor", "Description color"],
                          ["tagTextColor", "Eyebrow text color"],
                          ["tagBackgroundColor", "Eyebrow background"],
                          ["primaryButtonBackgroundColor", "Primary button"],
                          ["primaryButtonTextColor", "Primary button text"],
                          ["secondaryButtonBackgroundColor", "Secondary button"],
                          ["secondaryButtonTextColor", "Secondary button text"],
                          ["secondaryButtonBorderColor", "Secondary button border"],
                          ["overlayColor", "Overlay color"],
                        ] as const
                      ).map(([field, label]) => (
                        <label
                          key={field}
                          className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700"
                        >
                          {label}
                          <input
                            type="color"
                            value={slide[field]}
                            aria-label={label}
                            onChange={(event) =>
                              updateHeroSlide(index, field, event.target.value)
                            }
                            className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                        </label>
                      ))}
                      <label className="block text-xs font-medium text-gray-700">
                        Overlay strength ({Math.round(slide.overlayOpacity * 100)}%)
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={Math.round(slide.overlayOpacity * 100)}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "overlayOpacity",
                              Number(event.target.value) / 100
                            )
                          }
                          className="mt-3 w-full accent-purple-600"
                        />
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Eyebrow background ({Math.round(slide.tagBackgroundOpacity * 100)}%)
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(slide.tagBackgroundOpacity * 100)}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "tagBackgroundOpacity",
                              Number(event.target.value) / 100
                            )
                          }
                          className="mt-3 w-full accent-purple-600"
                        />
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Secondary button fill ({Math.round(slide.secondaryButtonBackgroundOpacity * 100)}%)
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(slide.secondaryButtonBackgroundOpacity * 100)}
                          onChange={(event) =>
                            updateHeroSlide(
                              index,
                              "secondaryButtonBackgroundOpacity",
                              Number(event.target.value) / 100
                            )
                          }
                          className="mt-3 w-full accent-purple-600"
                        />
                      </label>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
              No hero slides yet. Add a slide and upload an image to show the homepage hero.
            </p>
          )}
        </section>
        )}
      </form>
    </div>
  );
}
