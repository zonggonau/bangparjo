export default function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
  const organizationJson = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BangParjo Shop",
    "url": baseUrl,
    "logo": baseUrl + "/logo-banner.png",
    "sameAs": [
      "https://facebook.com/bangparjo.shop",
      "https://twitter.com/bangparjo_shop",
      "https://instagram.com/bangparjo.shop"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+62-812-3456-7890",
      "contactType": "customer service",
      "areaServed": "Global",
      "availableLanguage": "English"
    }
  };

  const websiteJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BangParjo Shop",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": baseUrl + "/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJson) }}
      />
    </>
  );
}
