import Link from 'next/link';
import { Star, Users, Package, Heart, CheckCircle2, ArrowRight } from 'lucide-react';

export default function FeaturedSection() {
  const stats = [
    { value: '50,000+', label: 'Products Available', icon: Package, color: 'text-primary' },
    { value: '10,000+', label: 'Happy Customers', icon: Users, color: 'text-blue-500' },
    { value: '4.8/5', label: 'Average Rating', icon: Star, color: 'text-yellow-500' },
    { value: '99%', label: 'Satisfaction Rate', icon: Heart, color: 'text-red-500' },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-[#07070e]">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left: Brand story */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-8">
              <Star size={12} className="fill-primary" /> Why Choose Us
            </span>
            
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 uppercase italic leading-[0.9]">
              SHOP GLOBAL,<br />
              <span className="text-primary text-glow">EASY & TRUSTED</span>
            </h2>
            
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-2xl font-medium">
              bangparjo.shop is your premium gateway to the global marketplace. We curate the world&apos;s most innovative products and deliver them with localized trust and efficiency.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {[
                'Verified global suppliers only',
                'Worldwide shipping to 200+ countries',
                'Aggressive competitive pricing',
                'Hyper-responsive 24/7 support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 group">
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                    <CheckCircle2 size={14} className="text-primary" />
                  </div>
                  <span className="text-xs font-black text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">{item}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/?q=best seller" 
              className="group inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-2xl shadow-white/5"
            >
              Start Shopping <ArrowRight size={20} className="transition-transform group-hover:translate-x-2" />
            </Link>
          </div>

          {/* Right: Stats cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <div 
                key={stat.label} 
                className={`group p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 ${i % 2 !== 0 ? 'mt-8' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${stat.color} border border-white/5 shadow-inner`}>
                  <stat.icon size={24} />
                </div>
                <div className={`text-2xl md:text-3xl font-black mb-1 tracking-tighter ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

