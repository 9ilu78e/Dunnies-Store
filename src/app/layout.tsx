import type { Metadata } from "next";
import "./globals.css";
import "@/styles/loader.css";
import ClientLayout from "./ClientLayout";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "Dunnies Store",
  description: "Your trusted online shopping destination",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
