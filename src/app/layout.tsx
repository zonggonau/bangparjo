import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | bangparjo.shop',
    default: 'bangparjo.shop — Global Shopping, Best Prices',
  },
  description: "Your trusted global dropshipping marketplace. Cari produk global terbaik dengan harga termurah di Indonesia. Fashion, electronics, beauty, and more.",
  keywords: "dropshipping, online shopping Indonesia, global products, fashion, electronics, beauty, worldwide shipping, belanja online, impor produk",
  authors: [{ name: 'bangparjo' }],
  metadataBase: new URL('https://bangparjo.shop'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "bangparjo.shop — Global Shopping, Best Prices",
    description: "Your trusted global dropshipping marketplace with worldwide shipping. Belanja produk global jadi lebih mudah.",
    url: 'https://bangparjo.shop',
    siteName: 'bangparjo.shop',
    images: [
      {
        url: '/next.svg', // Replace with actual logo/banner later
        width: 1200,
        height: 630,
        alt: 'bangparjo.shop Banner',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'bangparjo.shop — Global Shopping, Best Prices',
    description: 'Your trusted global dropshipping marketplace with worldwide shipping.',
    images: ['/next.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-id', // User should replace this
  },
};

import { Providers } from "@/components/Providers";
import Analytics from "@/components/Analytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Analytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

