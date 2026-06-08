'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { isProductData, parseProductData, renderProductTemplate } from '@/lib/blog-templates';
import { getBlogPostsAction } from '@/lib/actions-content';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  author: string;
  createdAt: string;
  updatedAt: string;
  language?: string;
}

interface Props {
  slug: string;
}

export default function BlogDetailClient({ slug }: Props) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    getBlogPostsAction(slug)
      .then(data => {
        if (data.success) setPost(data.data as unknown as BlogPost);
        else setError(data.error || 'Post not found');
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Detect if content is a product JSON and render the product template
  const productHtml = useMemo(() => {
    if (!post) return null;
    const productData = parseProductData(post.content);
    if (!productData) return null;
    // Render the full product landing page template
    // sellingPrice dari DB sudah include margin — tidak perlu kirim markupPct
    return renderProductTemplate(productData, '628219105980', window.location.origin);
  }, [post]);

  // Check if content is raw HTML (not JSON)
  const isRawHtml = useMemo(() => {
    if (!post) return false;
    try {
      JSON.parse(post.content);
      return false; // It's JSON, not raw HTML
    } catch {
      return true; // Not JSON, treat as raw HTML
    }
  }, [post]);

  // Extract AI content for sharing
  const shareContent = useMemo(() => {
    if (!post) return null;
    const productData = parseProductData(post.content);
    if (!productData) return null;
    const ai = (productData as any).ai || {};
    const lang = post.language || 'en';
    const isIndo = lang === 'id';
    return {
      title: ai.seoTitle || post.title,
      description: ai.seoDescription || post.excerpt || '',
      adCopy: ai.adCopy || '',
      tagline: ai.tagline || '',
      hashtags: isIndo
        ? ['BangParjo', 'BelanjaOnline', 'Promo', 'Diskon', 'ProdukTerkini']
        : ['BangParjo', 'OnlineShopping', 'Deal', 'Discount', 'Trending'],
      url: typeof window !== 'undefined' ? window.location.href : '',
      image: post.image || '',
    };
  }, [post]);

  const handleShare = (platform: string) => {
    if (!shareContent) return;
    const { title, description, adCopy, hashtags, url } = shareContent;
    const shareText = adCopy
      ? `${adCopy}\n\n${title}\n${url}`
      : `${title}\n\n${description}\n${url}`;
    const shareHashtags = hashtags.map(h => `#${h}`).join(' ');

    switch (platform) {
      case 'whatsapp': {
        const waText = encodeURIComponent(`${shareText}\n\n${shareHashtags}`);
        window.open(`https://wa.me/?text=${waText}`, '_blank');
        break;
      }
      case 'facebook': {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      }
      case 'twitter': {
        const tweetText = encodeURIComponent(`${adCopy || title}\n\n${shareHashtags}`);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      }
      case 'telegram': {
        const tgText = encodeURIComponent(`${shareText}\n\n${shareHashtags}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${tgText}`, '_blank');
        break;
      }
      case 'copy': {
        navigator.clipboard.writeText(`${shareText}\n\n${shareHashtags}\n${url}`);
        setShareOpen(false);
        break;
      }
    }
    setShareOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[800px] mx-auto px-4 py-16 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'The blog post you\'re looking for doesn\'t exist.'}</p>
          <Link href="/blog" className="inline-block bg-[#FF6B00] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e55e00] transition-colors no-underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // If it's a product landing page, render the full template (no blog chrome)
  if (productHtml) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 z-50 m-4 flex items-center gap-2">
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-[#FF6B00] hover:border-[#FF6B00] transition-all no-underline">
            ← Blog
          </Link>
          {/* Share Button */}
          {shareContent && (
            <div className="relative">
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="inline-flex items-center gap-1 text-sm bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-[#FF6B00] hover:border-[#FF6B00] transition-all no-underline"
                title="Share"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
              {shareOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 min-w-[200px] z-50">
                  <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-green-500 text-lg">💬</span> WhatsApp
                  </button>
                  <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-blue-600 text-lg">📘</span> Facebook
                  </button>
                  <button onClick={() => handleShare('twitter')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sky-500 text-lg">🐦</span> Twitter / X
                  </button>
                  <button onClick={() => handleShare('telegram')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-blue-500 text-lg">✈️</span> Telegram
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button onClick={() => handleShare('copy')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-gray-400 text-lg">📋</span> Copy Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div dangerouslySetInnerHTML={{ __html: productHtml }} suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back link */}
      <div className="max-w-[800px] mx-auto px-4 pt-8">
        <Link href="/blog" className="text-sm text-gray-500 hover:text-[#FF6B00] transition-colors no-underline">
          ← Back to Blog
        </Link>
      </div>

      <article className="max-w-[800px] mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>By <strong>{post.author}</strong></span>
            <span>·</span>
            <span>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Featured image */}
        {post.image && (
          <div className="mb-10 rounded-xl overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Content — render as HTML if it's raw HTML, or show JSON if it's unrecognized JSON */}
        {isRawHtml ? (
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#FF6B00] prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
            suppressHydrationWarning
          />
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>Product content is loading...</p>
          </div>
        )}

        {/* Footer with Share */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#FF6B00] font-semibold hover:underline no-underline"
          >
            ← Back to Blog
          </Link>

          {/* Share Button */}
          {shareContent && (
            <div className="relative">
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="inline-flex items-center gap-2 bg-[#FF6B00] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e55e00] transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </button>
              {shareOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 min-w-[200px] z-50">
                  <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-green-500 text-lg">💬</span> WhatsApp
                  </button>
                  <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-blue-600 text-lg">📘</span> Facebook
                  </button>
                  <button onClick={() => handleShare('twitter')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-sky-500 text-lg">🐦</span> Twitter / X
                  </button>
                  <button onClick={() => handleShare('telegram')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-blue-500 text-lg">✈️</span> Telegram
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button onClick={() => handleShare('copy')} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-gray-400 text-lg">📋</span> Copy Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
