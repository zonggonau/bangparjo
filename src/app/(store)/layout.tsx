import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIChat from '@/components/AIChat';
import LiveSales from '@/components/LiveSales';
import { CartProvider } from '@/context/CartContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { getDBStoreSettings } from '@/lib/pricing';

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getDBStoreSettings();

  return (
    <SettingsProvider initialSettings={settings}>
      <CartProvider>
        <div className="store-layout">
          <Navbar />
          <main>{children}</main>
          <Footer />
          {/* <AIChat /> */}
          <LiveSales />
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}
