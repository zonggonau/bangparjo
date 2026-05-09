import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Track your bangparjo.shop order status in real-time. Enter your Order ID to see shipping updates and carrier information.',
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
