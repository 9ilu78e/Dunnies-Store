"use client";

import { useSiteSettings } from "./SiteSettingsProvider";

export default function TermsContactDetails() {
  const { supportEmail, supportPhone, address } = useSiteSettings();
  return (
    <div className="mt-4 space-y-2">
      <p>Email: {supportEmail}</p>
      <p>Phone: {supportPhone}</p>
      <p>Address: {address}</p>
    </div>
  );
}
