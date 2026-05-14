import Link from 'next/link';
import { Zap, Smartphone, Shirt, Truck, ChevronRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main promo */}
          <div className="lg:col-span-7 relative group overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#FF6B35] to-[#E94560] p-10 md:p-16 flex flex-col justify-center min-h-[400px] shadow-2xl">
            {/* Background Decoration */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute top-10 right-10 text-[10rem] opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700">🔥</div>
            
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">
                <Zap size={14} className="fill-white" /> Limited Time Offer
              </span>
              <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 uppercase italic leading-[0.9]">
                FLASH <span className="block">SALE</span>
              </h3>
              <p className="text-xl md:text-3xl font-black text-white/80 uppercase tracking-tight mb-8">
                Up to <span className="text-white underline decoration-white/30 underline-offset-8">70% OFF</span>
              </p>
              <p className="text-white/60 text-sm md:text-base font-medium max-w-md mb-10 leading-relaxed uppercase tracking-widest">
                Thousands of handpicked premium products at unprecedented prices. Valid until stock lasts.
              </p>
              <Link 
                href="/?q=sale discount" 
                className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 shadow-xl shadow-black/5"
              >
                Shop Now <ChevronRight size={20} />
              </Link>
            </div>
          </div>

          {/* Sub promos */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-6">
            <Link 
              href="/category/electronics" 
              className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] p-8 flex items-center justify-between border border-white/5 shadow-xl hover:shadow-primary/10 transition-all duration-500"
            >
              <div className="relative z-10">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Smartphone size={20} className="text-primary" /> Electronics
                </h4>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Starting from $3.99</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-black transition-all duration-500">
                <ChevronRight size={20} />
              </div>
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:scale-125 transition-transform duration-500 italic font-black">TECH</div>
            </Link>

            <Link 
              href="/category/womens-clothing" 
              className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6B46C1] to-[#553C9A] p-8 flex items-center justify-between border border-white/5 shadow-xl hover:shadow-accent/10 transition-all duration-500"
            >
              <div className="relative z-10">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Shirt size={20} className="text-accent-light" /> Fashion
                </h4>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Weekly New Arrivals</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white group-hover:bg-accent-light group-hover:text-black transition-all duration-500">
                <ChevronRight size={20} />
              </div>
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:scale-125 transition-transform duration-500 italic font-black">CHIC</div>
            </Link>

            <Link 
              href="/?q=trending" 
              className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#059669] to-[#047857] p-8 flex items-center justify-between border border-white/5 shadow-xl hover:shadow-green-500/10 transition-all duration-500"
            >
              <div className="relative z-10">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                  <Truck size={20} className="text-green-400" /> Free Shipping
                </h4>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">On Orders Over $50</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white group-hover:bg-green-400 group-hover:text-black transition-all duration-500">
                <ChevronRight size={20} />
              </div>
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-5 group-hover:scale-125 transition-transform duration-500 italic font-black">FAST</div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

