import { SettingsProvider } from '@/context/SettingsContext';
import { getDBStoreSettings } from '@/lib/pricing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getDBStoreSettings();
  return (
    <SettingsProvider initialSettings={settings}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </SettingsProvider>
  );
}

