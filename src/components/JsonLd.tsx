export default function JsonLd() {
  const organizationJson = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BangParjo Shop",
    "url": "https://bangparjo.shop",
    "logo": "https://bangparjo.shop/logo-banner.png",
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
    "url": "https://bangparjo.shop",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bangparjo.shop/?q={search_term_string}",
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
