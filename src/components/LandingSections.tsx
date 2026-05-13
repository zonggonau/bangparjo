'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/cj-api';
import ProductCard from '@/components/ProductCard';
import { Flame, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingSections() {
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bestRes, newRes] = await Promise.all([
          getProducts({ pageSize: 4, keyWord: 'trending' }),
          getProducts({ pageSize: 4, keyWord: '2024 new' })
        ]);
        
        if (bestRes.success) setBestSellers(bestRes.data.list);
        if (newRes.success) setNewArrivals(newRes.data.list);
      } catch (error) {
        console.error('Failed to fetch landing products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container px-4 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-32 py-20">
      {/* Best Sellers Section */}
      <section className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-primary fill-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Global Hotlist</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              BEST <span className="text-primary text-glow">SELLERS</span>
            </h2>
          </div>
          <Link 
            href="/?q=trending" 
            className="group flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Explore Hotlist <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {bestSellers.map(p => <ProductCard key={p.pid} product={p} />)}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent-light" />
              <span className="text-[10px] font-black text-accent-light uppercase tracking-[0.2em]">Just Landed</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              NEW <span className="text-accent-light text-glow">ARRIVALS</span>
            </h2>
          </div>
          <Link 
            href="/?q=new" 
            className="group flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            View New Drops <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {newArrivals.map(p => <ProductCard key={p.pid} product={p} />)}
        </div>
      </section>
    </div>
  );
}

