import Link from 'next/link';
import '../globals.css';
import { connection } from 'next/server';
import { auth } from '@/auth';

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="py-6 border-b border-gray-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-5 flex justify-between items-center">
          <Link href="/" className="text-[24px] font-black text-[#1A1A1A] no-underline">
            Bang<span className="text-[#FF6B00]">Parjo</span>
          </Link>
          <div className="text-[13px] text-gray-400 font-semibold flex items-center gap-5">
            {session ? (
              <span className="text-gray-500">
                <i className="far fa-user mr-1"></i>
                {session.user?.email}
              </span>
            ) : (
              <Link href="/login" className="text-gray-400 no-underline hover:text-[#FF6B00]">Login</Link>
            )}
            <span><i className="fas fa-lock"></i> Secure Checkout</span>
          </div>
        </div>
      </header>
      <main className="py-10">
        {children}
      </main>
      <footer className="py-10 text-center border-t border-gray-200 text-gray-400 text-[12px]">
        <div className="max-w-[1400px] mx-auto px-5">
          <p>&copy; {new Date().getFullYear()} BangParjo Shop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
