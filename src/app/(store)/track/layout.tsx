import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order | bangparjo.shop',
  description: 'Track your order status in real time. Enter your Order ID to see shipment status, tracking number, and estimated delivery.',
  robots: { index: true, follow: true },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
