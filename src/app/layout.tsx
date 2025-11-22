import type { Metadata } from "next";
import "./globals.css";
import "@/styles/loader.css";
import ClientLayout from "./ClientLayout";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

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
        <CartProvider>
          <WishlistProvider>
            <ClientLayout>{children}</ClientLayout>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
