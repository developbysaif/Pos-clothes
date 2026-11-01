import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://mrbilalwear.com'),
  title: {
    default: 'MR BILAL - Luxury Ladies Wear POS & Inventory System',
    template: '%s | MR BILAL POS',
  },
  description:
    'Enterprise Ladies Clothing Store Point-of-Sale & Inventory Management System. Dual USB & live camera barcode scanning, multi-branch inventory tracking, garment tag printing, and thermal receipt generation.',
  keywords: [
    'ladies wear pos',
    'clothing boutique pos',
    'pakistan fashion pos',
    'barcode inventory system',
    'eastern wear pos',
    'thermal receipt printer pos',
  ],
  authors: [{ name: 'MR BILAL Ladies Wear & Couture' }],
  creator: 'MR BILAL Engineering',
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://mrbilalwear.com',
    siteName: 'MR BILAL POS & Inventory',
    title: 'MR BILAL - Luxury Ladies Wear POS & Inventory System',
    description:
      'Next-Gen Point-of-Sale with live dual barcode scanning, thermal receipt printing, and real-time inventory management for fashion boutiques.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MR BILAL - Luxury Ladies Wear POS & Inventory System',
    description:
      'Modern Responsive Point-of-Sale with Real-Time Barcode Scanner for Boutique & Apparel.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#09090b',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
