import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | bangparjo.shop',
    default: 'bangparjo.shop — Global Shopping, Best Prices',
  },
  description: "Your trusted global e-commerce marketplace. Find the best global products at the lowest prices. Fashion, electronics, beauty, and more.",
  keywords: "e-commerce, online shopping, global products, fashion, electronics, beauty, worldwide shipping, online store, imported products",
  authors: [{ name: 'bangparjo' }],
  metadataBase: new URL('https://bangparjo.shop'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "bangparjo.shop — Global Shopping, Best Prices",
    description: "Your trusted global e-commerce marketplace with worldwide shipping. Global shopping made easy.",
    url: 'https://bangparjo.shop',
    siteName: 'bangparjo.shop',
    images: [
      {
        url: '/logo-banner.png',
        width: 1200,
        height: 630,
        alt: 'bangparjo.shop — Trusted Global Shopping Hub',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'bangparjo.shop — Global Shopping, Best Prices',
    description: 'Buy your favorite global products with worldwide shipping at the best prices.',
    images: ['/logo-banner.png'],
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

