'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AboutData {
  id: string;
  title: string;
  content: string;
  image: string | null;
  mission: string | null;
  vision: string | null;
}

export default function AboutPage() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/about')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAbout(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[900px] mx-auto px-4 py-16 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-8 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] text-white py-16 sm:py-20">
        <div className="max-w-[900px] mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
            {about?.title || 'About Us'}
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Your trusted partner in global dropshipping — powered by CJ Dropshipping
          </p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-12 sm:py-16">
        {/* Featured image */}
        {about?.image && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={about.image}
              alt={about.title}
              className="w-full h-auto max-h-[450px] object-cover"
            />
          </div>
        )}

        {/* Content from admin */}
        {about?.content && (
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#FF6B00] prose-img:rounded-xl mb-12"
            dangerouslySetInnerHTML={{ __html: about.content }}
          />
        )}

        {/* Default content if no admin content */}
        {!about?.content && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to BangParjo Shop</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              BangParjo Shop is a premier dropshipping store powered by <strong>CJ Dropshipping</strong> — 
              one of the world's leading dropshipping and fulfillment platforms. We connect you with 
              thousands of quality products sourced directly from manufacturers, with global shipping 
              to over 200 countries worldwide.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our platform is built on the robust CJ Dropshipping infrastructure, which includes 
              multiple global warehouses, automated order fulfillment, real-time inventory sync, 
              and competitive shipping rates. This means faster delivery times and better prices 
              for our customers.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Whether you're looking for fashion, electronics, home goods, beauty products, or 
              unique gifts, we've got you covered. Our team works tirelessly to curate the best 
              products at the most competitive prices.
            </p>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '🌍',
              title: 'Global Shipping',
              desc: 'Fast and reliable shipping to over 200 countries worldwide with multiple carrier options.',
            },
            {
              icon: '🏭',
              title: 'Direct from Manufacturers',
              desc: 'Products sourced directly from thousands of manufacturers at factory prices.',
            },
            {
              icon: '📦',
              title: '24h Fulfillment',
              desc: 'Orders processed and shipped within 24 hours from our global warehouses.',
            },
            {
              icon: '🛡️',
              title: 'Quality Control',
              desc: 'Every package undergoes strict quality inspection before shipping.',
            },
            {
              icon: '💬',
              title: '24/7 Support',
              desc: 'Our dedicated support team is available around the clock to help you.',
            },
            {
              icon: '🔄',
              title: 'Easy Returns',
              desc: 'Hassle-free return process with our comprehensive dispute resolution system.',
            },
          ].map(feature => (
            <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        {(about?.mission || about?.vision) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {about?.mission && (
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-8 border border-orange-100">
                <div className="text-3xl mb-4">🎯</div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed">{about.mission}</p>
              </div>
            )}
            {about?.vision && (
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 border border-blue-100">
                <div className="text-3xl mb-4">🔭</div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed">{about.vision}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { icon: '🌍', label: 'Countries Served', value: '200+' },
            { icon: '📦', label: 'Products Available', value: '500K+' },
            { icon: '🚀', label: 'Orders Shipped', value: '10K+' },
            { icon: '⭐', label: 'Customer Rating', value: '4.8/5' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-extrabold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-[#FF6B00] to-[#E06000] rounded-2xl p-10 text-white">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to Start Shopping?</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Browse our catalog of 500,000+ products and find exactly what you need.
          </p>
          <Link
            href="/category"
            className="inline-block bg-white text-[#FF6B00] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors no-underline"
          >
            Browse Products →
          </Link>
        </div>
      </div>
    </div>
  );
}
