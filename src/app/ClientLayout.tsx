"use client";
import CookieConsent from "@/components/layout/CookieConsent";
import { ToastContainer } from "@/components/ui/Toast";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main>{children}</main>
      <CookieConsent />
      <ToastContainer />
    </>
  );
}
