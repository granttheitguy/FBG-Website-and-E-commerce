import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fashion By Grant | FBG Lagos",
  description: "Premium African bespoke fashion and contemporary clothing from Alagbado, Lagos.",
};

import { CartProvider } from "@/context/CartContext"
import { WishlistProvider } from "@/context/WishlistContext"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-surface-primary text-obsidian-900">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
