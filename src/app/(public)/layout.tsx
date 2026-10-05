import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SiteSettingsProvider from "@/components/layout/SiteSettingsProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsProvider>
      <Header />
      <main className="min-h-screen has-[.login-page]:min-h-0">{children}</main>
      <Footer />
    </SiteSettingsProvider>
  );
}
