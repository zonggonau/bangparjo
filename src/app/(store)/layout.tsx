import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '../globals.css';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
