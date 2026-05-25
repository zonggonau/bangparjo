'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBlogPostsAction } from '@/lib/actions-content';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  author: string;
  createdAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPostsAction()
      .then(data => {
        if (data.success) setPosts((data.data as any) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] text-white py-16 sm:py-20">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">Our Blog</h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Tips, guides, and insights about dropshipping, product sourcing, and growing your online business.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-[1200px] mx-auto px-4 py-12 sm:py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No posts yet</h2>
            <p className="text-gray-500">Check back soon for new articles!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <a
                key={post.id}
                href={`/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 no-underline"
              >
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                      📰
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })} · By {post.author}
                  </p>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#FF6B00] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="mt-4 text-[#FF6B00] text-sm font-semibold group-hover:underline">
                    Read More →
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
