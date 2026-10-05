"use client";

import { useSiteSettings } from "./SiteSettingsProvider";

export default function SupportEmailLink() {
  const { supportEmail } = useSiteSettings();
  return (
    <a
      className="font-semibold text-purple-700 underline"
      href={`mailto:${supportEmail}`}
    >
      {supportEmail}
    </a>
  );
}
