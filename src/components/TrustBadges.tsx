'use client';

import { ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    { icon: ShieldCheck, title: 'Buyer Protection', desc: 'Secure transactions & data privacy', color: 'text-green-500' },
    { icon: Truck, title: 'Global Shipping', desc: 'Tracked delivery to 200+ countries', color: 'text-primary' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '30-day money back guarantee', color: 'text-blue-500' },
    { icon: Lock, title: 'Secure Payment', desc: 'Encrypted payment processing', color: 'text-orange-500' },
  ];

  return (
    <section className="py-20 bg-white/5 border-y border-white/5 backdrop-blur-3xl">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {badges.map((badge) => (
            <div key={badge.title} className="flex items-start gap-5 group">
              <div className="w-12 h-12 shrink-0 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                <badge.icon className={`${badge.color} group-hover:scale-110 transition-transform`} size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">{badge.title}</h3>
                <p className="text-xs font-medium text-white/30 leading-relaxed uppercase tracking-widest">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">Accepted Secure Payments</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {['Visa', 'Mastercard', 'PayPal', 'GoPay', 'OVO', 'Dana', 'QRIS'].map((method) => (
              <span key={method} className="text-sm font-black text-white uppercase tracking-widest">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

