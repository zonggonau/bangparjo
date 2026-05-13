import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  robots: { index: false }, // Don't index direct checkout pages
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  // Standalone layout — NO navbar, NO footer. Pure conversion funnel.
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  );
}
