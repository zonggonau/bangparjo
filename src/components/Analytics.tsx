'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function AnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  useEffect(() => {
    if (GA_ID && (window as any).gtag) {
      (window as any).gtag('config', GA_ID, {
        page_path: pathname + searchParams.toString(),
      });
    }
    if (FB_PIXEL_ID && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
  }, [pathname, searchParams, GA_ID, FB_PIXEL_ID]);

  return (
    <>
      {/* Google Analytics */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {FB_PIXEL_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}
