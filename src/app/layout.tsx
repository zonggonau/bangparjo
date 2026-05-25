import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

export const metadata: Metadata = {
  title: {
    template: '%s | bangparjo.shop',
    default: 'bangparjo.shop — Global Shopping, Best Prices',
  },
  description: "Your trusted global e-commerce marketplace. Find the best global products at the lowest prices. Fashion, electronics, beauty, and more.",
  keywords: "e-commerce, online shopping, global products, fashion, electronics, beauty, worldwide shipping, online store, imported products",
  authors: [{ name: 'bangparjo' }],
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "bangparjo.shop — Global Shopping, Best Prices",
    description: "Your trusted global e-commerce marketplace with worldwide shipping. Global shopping made easy.",
    url: baseUrl,
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
  icons: {
    icon: '/favicon.svg',
  },
  verification: {
    google: 'google-site-verification-id', // User should replace this
  },
};

import { Providers } from "@/components/Providers";
import Analytics from "@/components/Analytics";
import ScrollToTop from "@/components/ScrollToTop";
import { getCachedStoreSettings } from "@/lib/server-settings";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSettings = await getCachedStoreSettings();
  const storeUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ScrollToTop />
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "bangparjo.shop",
              "url": storeUrl,
              "logo": storeUrl + "/logo-banner.png",
              "description": "Your trusted global e-commerce marketplace. Find the best global products at the lowest prices.",
              "sameAs": [
                "https://facebook.com/bangparjo",
                "https://instagram.com/bangparjo",
                "https://tiktok.com/@bangparjo"
              ],
              "potentialAction": {
                "@type": "SearchAction",
                "target": storeUrl + "/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BangParjo" />

        <Analytics />
        <Providers initialSettings={initialSettings}>
          {children}
        </Providers>
        
        {/* Font Awesome for Template Icons */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </body>
    </html>
  );
}

