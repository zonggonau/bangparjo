// Margin sudah dihitung saat import produk — sellingPrice di DB sudah include margin.
// Tidak perlu import calculateFinalPrice di sini.

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Blog Content Templates
 *
 * The blog `content` field can be either:
 * 1. Raw HTML — rendered as-is (for marketing pages, custom landing pages)
 * 2. JSON with `type: "product"` — rendered using the product template below
 * 3. JSON with `type: "template"` and `templateId` — rendered using one of the 10 templates
 */

export interface ProductVariantData {
  id: string;
  cjId: string;
  sku: string;
  color: string | null;
  size: string | null;
  weight: number;
  baseCost: number;
  sellingPrice: number;
  inventory: number;
  image: string | null;
}

export interface CouponOffer {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: number;
  description: string;
  minPurchase?: number;
  expiresAt?: string;
}

export interface ShippingMethod {
  shippingName: string;
  shippingCost: number;
  estimatedDays: string;
  shippingType: string;
}

export interface ProductData {
  type: 'product';
  productId: string;
  cjId: string;
  slug?: string; // blog post slug — used for the product detail link
  name: string;
  description: string;
  images: string[];
  variants: ProductVariantData[];
  recommendations?: Array<{
    title: string;
    slug: string;
    image: string | null;
    price: string;
  }>;
  createdAt: string;
  /** Optional coupon offer to display on the landing page */
  coupon?: CouponOffer;
  /** Real-time shipping methods from CJ API */
  shippingMethods?: ShippingMethod[];
}



/**
 * Check if content is a product JSON object (handles both parsed objects and JSON strings)
 */
export function isProductData(content: any): content is ProductData {
  if (!content) return false;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' && parsed.type === 'product';
    } catch {
      return false;
    }
  }
  return typeof content === 'object' && content.type === 'product';
}

/**
 * Parse product data from blog content (handles both parsed objects and JSON strings)
 */
export function parseProductData(content: any): ProductData | null {
  if (!content) return null;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && parsed.type === 'product') {
        return parsed as ProductData;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof content === 'object' && content.type === 'product') {
    return content as ProductData;
  }
  return null;
}

/**
 * Render a premium landing page for social media ads
 * Uses root project colors: primary (#FF6B35), secondary (#1A1A2E), accent (#0F3460)
 * @param waNumber - WhatsApp number for the AI agent (with country code, no +)
 * @param baseUrl - Base URL of the store (e.g. https://bangparjo.shop) for product link
 */
export function renderProductTemplate(product: ProductData, waNumber?: string, baseUrl?: string): string {
  const whatsappNumber = waNumber || '628219105980';
  const storeBaseUrl = baseUrl || 'https://bangparjo.shop';
  // sellingPrice dari DB sudah include margin — langsung digunakan tanpa kalkulasi ulang
  function getDisplayPrice(v: any): number {
    if (!v) return 0;
    // Prioritas: sellingPrice (sudah include margin) → baseCost fallback
    if (typeof v === 'object') return v.sellingPrice || v.baseCost || 0;
    return v;
  }

  var minPrice = Math.min.apply(null, product.variants.map(function(v) { return getDisplayPrice(v); }));
  var maxPrice = Math.max.apply(null, product.variants.map(function(v) { return getDisplayPrice(v); }));
  var priceDisplay = minPrice === maxPrice
    ? '$' + minPrice.toFixed(2)
    : '$' + minPrice.toFixed(2) + ' - $' + maxPrice.toFixed(2);

  // Extract AI-generated content if available
  var ai: Record<string, any> = (product as any).ai || {};
  var tagline = ai.tagline || 'Best Quality, Best Price — Shop with Confidence';
  var heroBadges = ai.heroBadges || ['Best Seller', 'Global Shipping', 'Best Price'];
  var benefits = ai.benefits || [
    { icon: 'quality', title: 'Premium Quality', desc: 'High-quality products meeting international standards. Satisfaction guaranteed.' },
    { icon: 'price', title: 'Best Price Guarantee', desc: 'Get the best prices directly from suppliers. No middleman markup.' },
    { icon: 'shipping', title: 'Fast Worldwide Shipping', desc: 'Global delivery with real-time tracking. Free shipping on orders over $50.' },
  ];
  var socialProof = ai.socialProof || { sold: '2,500+', rating: '4.8', reviews: '850+' };
  var seoTitle = ai.seoTitle || product.name + ' — BangParjo';
  var seoDescription = ai.seoDescription || ('Shop ' + product.name + ' at the best price. Premium quality, fast worldwide shipping, and money-back guarantee.');
  var adCopy = ai.adCopy || (product.name + ' at unbeatable prices! Premium quality, fast global shipping, 30-day returns. Order now!');
  var faqs = ai.faqs || [];
  var shippingPolicy = ai.shippingPolicy || 'Worldwide shipping with estimated 7-21 business days. Tracking number provided after order processing. Free shipping on orders over $50.';
  var returnPolicy = ai.returnPolicy || '100% satisfaction guarantee. If the product doesn\'t meet your expectations, contact us within 7 days of delivery for a full refund.';

  // --- Safe HTML helpers ---
  function h(s: any): string { return escapeHtml(String(s)); }
  function hAttr(s: any): string { return escapeHtml(String(s)).replace(/&/g, '&'); }

  var safeName = h(product.name);
  var safeDesc = h(product.description);
  var safeTagline = h(tagline);
  var safeAdCopy = h(adCopy);
  var safeSeoTitle = h(seoTitle);
  var safeSeoDesc = h(seoDescription.substring(0, 160));
  var safeShipping = h(shippingPolicy);
  var safeReturn = h(returnPolicy);

  // Build product link — direct to product page with CJ ID and slug
  // Include first variant ID, color, size, and price as query params for pre-selection
  var firstVariant = product.variants[0];
  var variantParams = '';
  if (firstVariant) {
    var params: string[] = [];
    if (firstVariant.id) params.push('v=' + encodeURIComponent(firstVariant.id));
    if (firstVariant.cjId) params.push('vid=' + encodeURIComponent(firstVariant.cjId));
    if (firstVariant.color) params.push('color=' + encodeURIComponent(firstVariant.color));
    if (firstVariant.size) params.push('size=' + encodeURIComponent(firstVariant.size));
    params.push('price=' + getDisplayPrice(firstVariant).toFixed(2));
    variantParams = '?' + params.join('&');
  }
  var productSlugPath = product.slug ? product.slug : encodeURIComponent(product.name);
  var productLink = storeBaseUrl + '/product/' + product.cjId + '/' + productSlugPath + variantParams;
  var safeLink = hAttr(productLink);


  var variantRows = product.variants.map(function(v) {
    var variantName = h([v.color, v.size].filter(Boolean).join(' / ') || 'Default');
    var safeSku = h(v.sku);
    var stockStatus = v.inventory > 0
      ? '<span style="color:#10b981;">&#10003; In Stock</span>'
      : '<span style="color:#ef4444;">Out of Stock</span>';
    return '<tr>'
      + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1A1A2E;">' + variantName + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;">' + safeSku + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;">' + stockStatus + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#FF6B35;">$' + getDisplayPrice(v).toFixed(2) 
      + ' <span style="font-size:11px;color:#94a3b8;text-decoration:line-through;font-weight:500;margin-left:6px;">$' + (getDisplayPrice(v) * 1.35).toFixed(2) + '</span></td>'
      + '</tr>';
  }).join('');

  var galleryHtml = '';
  if (product.images.length > 1) {
    galleryHtml = product.images.slice(0, 6).map(function(img) {
      return '<div style="border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 2px 8px rgba(0,0,0,0.04);">'
        + '<img src="' + img + '" alt="' + safeName + '" style="width:100%;height:200px;object-fit:cover;display:block;" loading="lazy" />'
        + '</div>';
    }).join('');
  }

  var recsHtml = '';
  if (product.recommendations && product.recommendations.length > 0) {
    recsHtml = product.recommendations.map(function(r) {
      // Extract CJ ID from slug (format: name-cjId)
      var slugParts = r.slug.split('-');
      var recCjId = slugParts.length > 1 ? slugParts[slugParts.length - 1] : r.slug;
      var rLink = storeBaseUrl + '/product/' + recCjId + '/' + r.slug;
      return '<a href="' + rLink + '" style="display:block;background:white;padding:20px;border-radius:12px;border:1px solid #f1f5f9;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.04);text-decoration:none;transition:all 0.3s;" onmouseover="this.style.boxShadow=\'0 8px 30px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.04)\';this.style.transform=\'none\'">'
        + '<p style="color:#1A1A2E;line-height:1.5;margin-bottom:8px;font-size:14px;">' + h(r.title) + '</p>'
        + '<h4 style="color:#FF6B35;font-size:18px;">' + h(r.price) + '</h4>'
        + '</a>';
    }).join('');
  }

  var heroImage = product.images[0] || 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop';
  var fullDescription = safeDesc;
  var year = new Date().getFullYear();
  var totalVariants = product.variants.length;
  var totalInventory = product.variants.reduce(function(sum, v) { return sum + v.inventory; }, 0);
  var weightRange = '';
  var weights = product.variants.map(function(v) { return v.weight; }).filter(function(w) { return w > 0; });
  if (weights.length > 0) {
    var minW = Math.min.apply(null, weights);
    var maxW = Math.max.apply(null, weights);
    weightRange = minW === maxW ? minW + 'g' : minW + 'g - ' + maxW + 'g';
  }

  // --- Trust & Urgency Data ---
  var trustBadges = [
    { icon: '&#128274;', label: 'Secure Checkout', desc: 'SSL encrypted payment' },
    { icon: '&#128179;', label: 'Money-Back Guarantee', desc: '7-day refund policy' },
    { icon: '&#9989;', label: 'Verified Seller', desc: 'Trusted since 2024' },
    { icon: '&#128230;', label: 'Trackable Shipping', desc: 'Real-time tracking' },
  ];
  var paymentIcons = [
    '&#128179;', // credit card
    '&#127974;', // bank
    '&#128666;', // paypal/cod
  ];
  var visitorCount = 45; // Fixed initial visitors to prevent hydration mismatch, fluctuates on client
  var isLimitedStock = totalInventory > 0 && totalInventory < 100;
  var stockUrgencyLevel = totalInventory < 20 ? 'high' : (totalInventory < 50 ? 'medium' : 'low');
  var urgencyMessages = [
    '&#128680; ' + visitorCount + ' people are viewing this product right now',
    '&#9888; Low stock — only ' + totalInventory + ' units remaining',
    '&#9200; Limited time offer — price may increase soon',
  ];
  var randomUrgencyMsg = urgencyMessages[Math.floor(Math.random() * urgencyMessages.length)];

  // Icon SVGs for benefits
  var benefitIcons: Record<string, string> = {
    quality: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    price: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    shipping: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><polygon points="5.5 21 9 21 9 18 5.5 18 5.5 21"/><polygon points="13.5 21 17 21 17 18 13.5 18 13.5 21"/></svg>',
    shield: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  };

  // --- JSON-LD Product Schema ---
  var offers = product.variants.map(function(v) {
    return '{"@type":"Offer","price":"' + getDisplayPrice(v).toFixed(2) + '","priceCurrency":"USD","availability":"' + (v.inventory > 0 ? 'InStock' : 'OutOfStock') + '","sku":"' + hAttr(v.sku) + '"}';
  }).join(',');
  var jsonLd = '{\n'
    + '  "@context": "https://schema.org/",\n'
    + '  "@type": "Product",\n'
    + '  "name": ' + JSON.stringify(product.name) + ',\n'
    + '  "description": ' + JSON.stringify(seoDescription.substring(0, 200)) + ',\n'
    + '  "image": ' + JSON.stringify(product.images[0] || '') + ',\n'
    + '  "sku": ' + JSON.stringify(product.variants[0]?.sku || '') + ',\n'
    + '  "brand": { "@type": "Brand", "name": "BangParjo" },\n'
    + '  "offers": [' + offers + ']\n'
    + '}';

  // Build safe in-body tags (JSON-LD schema, hidden ad copy meta, and page styles)
  var result = '<!-- JSON-LD Product Schema -->\n'
    + '<script type="application/ld+json">\n'
    + jsonLd + '\n'
    + '</script>\n'
    + '<!-- adCopy (hidden — for ads manager) -->\n'
    + '<meta name="ad:copy" content="' + safeAdCopy + '">\n'
    + '<meta name="ad:headline" content="' + safeTagline + '">\n'
    + '<style>\n'
    + '@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}\n'
    + '@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}\n'
    + '@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}\n'
    + '@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}\n'
    + '@keyframes countPulse{0%,100%{opacity:1}50%{opacity:0.5}}\n'
    + '*{margin:0;padding:0;box-sizing:border-box;}\n'
    + 'html{scroll-behavior:smooth;}\n'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;background:#ffffff;color:#1A1A1A;overflow-x:hidden;}\n'
    + 'img{max-width:100%;display:block;}\n'
    + 'a{text-decoration:none;}\n'
    + '.container{width:90%;max-width:1200px;margin:auto;}\n'
    + '.section{padding:48px 0;}\n'
    + '.section-title{text-align:center;margin-bottom:32px;}\n'
    + '.section-title h2{font-family:"Outfit",-apple-system,sans-serif;font-size:26px;font-weight:800;color:#1A1A2E;margin-bottom:6px;letter-spacing:-0.5px;}\n'
    + '.section-title p{color:#64748b;font-size:14px;}\n'
    + '.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;}\n'
    + '.grid-3{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}\n'
    + '.grid-4{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;}\n'
    + '.card{background:white;border:1px solid #f1f5f9;border-radius:12px;padding:20px;transition:all 0.3s;}\n'
    + '.card:hover{box-shadow:0 8px 30px rgba(0,0,0,0.08);transform:translateY(-2px);}\n'
    + '.badge{display:inline-block;background:linear-gradient(135deg,#FFF3ED,#FFE4D6);color:#FF6B35;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.3px;}\n'
    + '.price{font-family:"Outfit",-apple-system,sans-serif;font-weight:800;color:#FF6B35;}\n'
    + '.btn{display:inline-block;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;transition:all 0.3s;cursor:pointer;border:none;letter-spacing:0.3px;}\n'
    + '.btn-primary{background:linear-gradient(135deg,#FF6B35,#E8551E);color:white;box-shadow:0 4px 15px rgba(255,107,53,0.3);}\n'
    + '.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(255,107,53,0.4);}\n'
    + '.btn-outline{border:2px solid #FF6B35;color:#FF6B35;background:transparent;}\n'
    + '.btn-outline:hover{background:#FFF3ED;}\n'
    + '.btn-wa{background:linear-gradient(135deg,#25D366,#1DA851);color:white;display:inline-flex;align-items:center;gap:10px;box-shadow:0 4px 15px rgba(37,211,102,0.3);animation:pulse 2s infinite;}\n'
    + '.btn-wa:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(37,211,102,0.4);}\n'
    + '.btn-sm{padding:10px 20px;font-size:13px;}\n'
    + '.table-wrap{overflow-x:auto;border:1px solid #f1f5f9;border-radius:12px;}\n'
    + 'table{width:100%;border-collapse:collapse;}\n'
    + 'th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-bottom:2px solid #f1f5f9;background:#fafafa;}\n'
    + 'td{padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1A1A2E;}\n'
    + 'tr:last-child td{border-bottom:none;}\n'
    + '.hero{min-height:100vh;display:flex;align-items:center;background:linear-gradient(160deg,#ffffff 0%,#FFF8F5 50%,#FFE4D6 100%);position:relative;overflow:hidden;padding:80px 0 60px;}\n'
    + '.hero::before{content:"";position:absolute;top:-50%;right:-20%;width:600px;height:600px;background:radial-gradient(circle,rgba(255,107,53,0.08) 0%,transparent 70%);border-radius:50%;pointer-events:none;}\n'
    + '.hero::after{content:"";position:absolute;bottom:-30%;left:-10%;width:400px;height:400px;background:radial-gradient(circle,rgba(37,211,102,0.06) 0%,transparent 70%);border-radius:50%;pointer-events:none;}\n'
    + '.hero .container{position:relative;z-index:1;}\n'
    + '.hero h1{font-family:"Outfit",-apple-system,sans-serif;font-size:42px;font-weight:900;color:#1A1A2E;margin-bottom:12px;line-height:1.15;letter-spacing:-1px;animation:fadeUp 0.6s ease-out;}\n'
    + '.hero p{color:#64748b;font-size:16px;line-height:1.7;margin-bottom:24px;max-width:520px;animation:fadeUp 0.6s ease-out 0.1s both;}\n'
    + '.hero .hero-badges{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;animation:fadeUp 0.6s ease-out 0.05s both;}\n'
    + '.hero .hero-badges span{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.8);backdrop-filter:blur(10px);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;color:#1A1A2E;border:1px solid rgba(255,107,53,0.15);}\n'
    + '.hero .hero-badges span i{color:#FF6B35;}\n'
    + '.hero .hero-actions{display:flex;gap:12px;flex-wrap:wrap;animation:fadeUp 0.6s ease-out 0.2s both;}\n'
    + '.hero .hero-image-wrap{position:relative;animation:float 4s ease-in-out infinite;}\n'
    + '.hero .hero-image-wrap img{border-radius:20px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.1);border:1px solid rgba(255,255,255,0.5);}\n'
    + '.hero .hero-image-wrap .price-tag{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);padding:10px 18px;border-radius:12px;font-family:"Outfit",-apple-system,sans-serif;font-weight:800;font-size:20px;color:#FF6B35;box-shadow:0 4px 15px rgba(0,0,0,0.1);border:1px solid rgba(255,107,53,0.2);}\n'
    + '.hero .hero-image-wrap .stock-badge{position:absolute;bottom:16px;left:16px;background:rgba(16,185,129,0.95);backdrop-filter:blur(10px);padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;color:white;display:flex;align-items:center;gap:6px;}\n'
    + '.detail-label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;}\n'
    + '.detail-value{font-size:15px;font-weight:700;color:#1A1A2E;}\n'
    + '.detail-value.price{font-size:22px;}\n'
    + '.desc-box{padding:28px;line-height:1.8;color:#475569;font-size:14px;white-space:pre-wrap;}\n'
    + '.faq-item{padding:16px 0;border-bottom:1px solid #f1f5f9;}\n'
    + '.faq-item:last-child{border-bottom:none;}\n'
    + '.faq-q{font-weight:700;color:#1A1A2E;font-size:14px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;}\n'
    + '.faq-q::before{content:"Q:";color:#FF6B35;font-weight:800;}\n'
    + '.faq-a{font-size:13px;color:#64748b;line-height:1.6;margin-left:28px;}\n'
    + '.faq-a::before{content:"A: ";color:#10b981;font-weight:700;}\n'
    + '.star{color:#f59e0b;font-size:18px;display:inline-block;}\n'
    + '.rating-bar{display:flex;align-items:center;gap:8px;margin:4px 0;}\n'
    + '.rating-fill{height:6px;border-radius:3px;background:linear-gradient(to right,#f59e0b,#f59e0b);flex:1;}\n'
    + '.rating-fill-bg{height:6px;border-radius:3px;background:#f1f5f9;flex:1;}\n'
    + '.policy-box{background:#fafafa;border:1px solid #f1f5f9;border-radius:12px;padding:20px;}\n'
    + '.policy-box h4{font-family:"Outfit",-apple-system,sans-serif;font-size:14px;font-weight:700;color:#1A1A2E;margin-bottom:8px;display:flex;align-items:center;gap:6px;}\n'
    + '.policy-box p{font-size:12px;color:#64748b;line-height:1.6;}\n'
    + '.wa-section{background:linear-gradient(135deg,#1A1A2E,#2D2D5E);padding:48px 0;text-align:center;}\n'
    + '.wa-section h2{font-family:"Outfit",-apple-system,sans-serif;font-size:26px;font-weight:800;color:white;margin-bottom:8px;}\n'
    + '.wa-section p{color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:24px;}\n'
    + '.wa-section .btn-wa{font-size:16px;padding:16px 44px;}\n'
    + 'footer{text-align:center;padding:20px;color:#94a3b8;font-size:12px;background:#fafafa;}\n'
    + '#sticky-wa{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999;display:none;}\n'
    + '#sticky-wa a{background:linear-gradient(135deg,#25D366,#1DA851);color:white;padding:14px 28px;border-radius:50px;font-weight:700;font-size:14px;box-shadow:0 8px 30px rgba(37,211,102,0.35);display:flex;align-items:center;gap:10px;animation:pulse 2s infinite;}\n'
    + '#sticky-wa a:hover{transform:translateY(-2px);}\n'
    + '@media(max-width:768px){\n'
    + '.grid-2{grid-template-columns:1fr;gap:28px;}\n'
    + '.grid-3{grid-template-columns:1fr 1fr;}\n'
    + '.hero{min-height:auto;padding:100px 0 48px;}\n'
    + '.hero h1{font-size:30px;}\n'
    + '.hero p{font-size:14px;}\n'
    + '.section-title h2{font-size:22px;}\n'
    + '.section{padding:40px 0;}\n'
    + '.container{width:92%;}\n'
    + '#sticky-wa{display:block;}\n'
    + '}\n'
    + '@media(max-width:480px){\n'
    + '.grid-3{grid-template-columns:1fr;}\n'
    + '.hero h1{font-size:26px;}\n'
    + '.btn{width:100%;text-align:center;justify-content:center;}\n'
    + '.section{padding:32px 0;}\n'
    + '.hero .hero-image-wrap .price-tag{font-size:16px;padding:8px 14px;}\n'
    + '}\n'
    + '</style>\n';

  // Hero section — modern landing page style
  var stockText = totalInventory > 0 ? '&#9989; In Stock' : '&#9203; Pre-Order';
  var stockColor = totalInventory > 0 ? '#10b981' : '#f59e0b';
  var urgencyText = totalInventory > 0 && totalInventory < 50
    ? '<div style="background:linear-gradient(135deg,#f43f5e,#e11d48);color:white;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;animation:pulse 2s infinite;">&#9888; Only ' + totalInventory + ' left in stock — Order soon!</div>\n'
    : '';
  var directCheckoutUrl = '/checkout?pid=' + encodeURIComponent(product.cjId);
  if (firstVariant) {
    directCheckoutUrl += '&vid=' + encodeURIComponent(firstVariant.cjId);
  }

  var heroActionsHtml = '<div class="hero-actions">\n'
    + '<a href="#checkout-section" class="btn btn-primary">&#128722; Order Now — ' + priceDisplay + '</a>\n'
    + '</div>\n';

  result += '<section class="hero">\n'
    + '<div class="container">\n'
    + '<div class="grid-2">\n'
    + '<div>\n'
    + urgencyText
    + '<div class="hero-badges">\n'
    + heroBadges.map(function(b: string) {
      return '<span><i>&#9733;</i> ' + h(b) + '</span>';
    }).join('\n')
    + '</div>\n'
    + '<h1>' + safeName + '</h1>\n'
    + '<p>' + safeTagline + '</p>\n'
    + heroActionsHtml
    + '</div>\n'
    + '<a href="' + safeLink + '" class="hero-image-wrap" style="display:block; text-decoration:none; cursor:pointer;">\n'
    + '<div class="price-tag">' + priceDisplay + '</div>\n'
    + '<div class="stock-badge" style="background:' + stockColor + ';">' + stockText + '</div>\n'
    + '<img src="' + heroImage + '" alt="' + safeName + '" fetchpriority="high" />\n'
    + '</a>\n'
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // Coupon banner removed

  // Social proof bar
  result += '<div style="background:#1A1A2E;padding:20px 0;">\n'


    + '<div class="container">\n'
    + '<div style="display:flex;justify-content:center;gap:48px;flex-wrap:wrap;">\n'
    + '<div style="text-align:center;">\n'
    + '<div style="font-family:Outfit,-apple-system,sans-serif;font-size:24px;font-weight:800;color:#FF6B35;">' + h(socialProof.sold) + '</div>\n'
    + '<div style="font-size:12px;color:rgba(255,255,255,0.6);">Sold</div>\n'
    + '</div>\n'
    + '<div style="text-align:center;">\n'
    + '<div style="font-family:Outfit,-apple-system,sans-serif;font-size:24px;font-weight:800;color:#FF6B35;">' + h(socialProof.rating) + '</div>\n'
    + '<div style="font-size:12px;color:rgba(255,255,255,0.6);">Rating</div>\n'
    + '</div>\n'
    + '<div style="text-align:center;">\n'
    + '<div style="font-family:Outfit,-apple-system,sans-serif;font-size:24px;font-weight:800;color:#FF6B35;">' + h(socialProof.reviews) + '</div>\n'
    + '<div style="font-size:12px;color:rgba(255,255,255,0.6);">Reviews</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</div>\n';

  // ── Urgency Bar (Live visitors + stock warning) ──────────────────────────────
  var urgencyBarBg = isLimitedStock
    ? 'linear-gradient(135deg,#f43f5e,#e11d48)'
    : 'linear-gradient(135deg,#FF6B35,#E8551E)';
  result += '<div style="background:' + urgencyBarBg + ';padding:12px 0;position:sticky;top:0;z-index:100;">\n'
    + '<div class="container">\n'
    + '<div style="display:flex;justify-content:center;align-items:center;gap:24px;flex-wrap:wrap;font-size:13px;color:white;font-weight:600;">\n'
    + '<span style="display:inline-flex;align-items:center;gap:6px;">&#128065; <span id="liveCount">' + visitorCount + '</span> people viewing now</span>\n'
    + (isLimitedStock ? '<span style="display:inline-flex;align-items:center;gap:6px;">&#9888; Only <strong>' + totalInventory + '</strong> left in stock</span>\n' : '')
    + '<span style="display:inline-flex;align-items:center;gap:6px;">&#9200; <span id="countdownTimer">47:59:59</span> left</span>\n'
    + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '<script>\n'
    + '(function(){\n'
    + '  // Live visitor counter — random fluctuation\n'
    + '  var count = ' + visitorCount + ';\n'
    + '  setInterval(function(){\n'
    + '    var el = document.getElementById("liveCount");\n'
    + '    if(!el) return;\n'
    + '    count += Math.floor(Math.random() * 3) - 1; // -1, 0, or +1\n'
    + '    if(count < 5) count = 5;\n'
    + '    if(count > 200) count = 200;\n'
    + '    el.textContent = count;\n'
    + '  }, 3000);\n'
    + '  // Countdown timer — 48 hours from now with client persistence\n'
    + '  var endTime;\n'
    + '  try {\n'
    + '    var endKey = "offer_end_' + product.cjId + '";\n'
    + '    endTime = localStorage.getItem(endKey);\n'
    + '    if(!endTime){\n'
    + '      endTime = new Date().getTime() + 172800000; // 48 hours\n'
    + '      localStorage.setItem(endKey, endTime);\n'
    + '    } else {\n'
    + '      endTime = parseInt(endTime, 10);\n'
    + '    }\n'
    + '  } catch(e) {\n'
    + '    endTime = new Date().getTime() + 172800000;\n'
    + '  }\n'
    + '  function updateTimer(){\n'
    + '    var el = document.getElementById("countdownTimer");\n'
    + '    if(!el) return;\n'
    + '    var now = new Date().getTime();\n'
    + '    var diff = endTime - now;\n'
    + '    if(diff <= 0){ el.textContent = "00:00:00"; return; }\n'
    + '    var h = Math.floor(diff / (1000*60*60));\n'
    + '    var m = Math.floor((diff % (1000*60*60)) / (1000*60));\n'
    + '    var s = Math.floor((diff % (1000*60)) / 1000);\n'
    + '    el.textContent = \n'
    + '      (h<10?"0":"") + h + ":" +\n'
    + '      (m<10?"0":"") + m + ":" +\n'
    + '      (s<10?"0":"") + s;\n'
    + '  }\n'
    + '  updateTimer();\n'
    + '  setInterval(updateTimer, 1000);\n'
    + '})();\n'
    + '</script>\n';

  // Benefits section
  result += '<section class="section">\n'
    + '<div class="container">\n'
    + '<div class="section-title">\n'
    + '<h2>Why Choose This Product?</h2>\n'
    + '<p>Benefits you\'ll get.</p>\n'
    + '</div>\n'
    + '<div class="grid-4">\n'
    + benefits.map(function(b: { icon: string; title: string; desc: string }) {
      var iconSvg = benefitIcons[b.icon] || benefitIcons['quality'];
      return '<div class="card" style="text-align:center;padding:28px 20px;">\n'
        + '<div style="margin-bottom:12px;">' + iconSvg + '</div>\n'
        + '<h3 style="font-family:Outfit,-apple-system,sans-serif;font-size:16px;font-weight:700;color:#1A1A2E;margin-bottom:6px;">' + h(b.title) + '</h3>\n'
        + '<p style="font-size:13px;color:#64748b;line-height:1.6;">' + h(b.desc) + '</p>\n'
        + '</div>';
    }).join('\n')
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // Rating stars — visual from social proof
  var ratingVal = parseFloat(String(socialProof.rating).replace(/[^0-9.]/g, '')) || 4.8;
  var fullStars = Math.floor(ratingVal);
  var halfStar = ratingVal - fullStars >= 0.5;
  var starsHtml = '';
  for (var si = 0; si < 5; si++) {
    if (si < fullStars) starsHtml += '<span class="star">&#9733;</span>';
    else if (si === fullStars && halfStar) starsHtml += '<span class="star" style="position:relative;">&#9734;<span style="position:absolute;left:0;top:0;overflow:hidden;width:50%;">&#9733;</span></span>';
    else starsHtml += '<span class="star">&#9734;</span>';
  }

  // Gallery section
  if (galleryHtml) {
    result += '<section id="gallery" class="section" style="background:#fafafa;">\n'
      + '<div class="container">\n'
      + '<div class="section-title">\n'
      + '<h2>Product Gallery</h2>\n'
      + '<p>See the product from every angle.</p>\n'
      + '</div>\n'
      + '<div class="grid-3" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">\n'
      + galleryHtml
      + '</div>\n'
      + '</div>\n'
      + '</section>\n';
  }

  // Product details summary
  result += '<section id="detail" class="section">\n'
    + '<div class="container">\n'
    + '<div class="section-title">\n'
    + '<h2>Product Details</h2>\n'
    + '<p>Complete info about ' + safeName + '</p>\n'
    + '</div>\n'
    + '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px;">\n'
    + starsHtml
    + '<span style="font-size:13px;color:#64748b;">' + h(socialProof.rating) + ' (' + h(socialProof.reviews) + ' reviews)</span>\n'
    + '</div>\n'
    + '<div class="grid-4">\n'
    + '<div class="card">\n'
    + '<div class="detail-label">Product Name</div>\n'
    + '<div class="detail-value">' + safeName + '</div>\n'
    + '</div>\n'
    + '<div class="card">\n'
    + '<div class="detail-label">Price</div>\n'
    + '<div class="detail-value price">' + priceDisplay + '</div>\n'
    + '</div>\n'
    + '<div class="card">\n'
    + '<div class="detail-label">Variants</div>\n'
    + '<div class="detail-value">' + totalVariants + ' variants</div>\n'
    + '</div>\n'
    + '<div class="card">\n'
    + '<div class="detail-label">Total Stock</div>\n'
    + '<div class="detail-value">' + totalInventory + ' units</div>\n'
    + '</div>\n'
    + (weightRange ? '<div class="card">\n'
    + '<div class="detail-label">Weight</div>\n'
    + '<div class="detail-value">' + weightRange + '</div>\n'
    + '</div>\n' : '')
    + '<div class="card">\n'
    + '<div class="detail-label">SKU</div>\n'
    + '<div class="detail-value" style="font-size:14px;word-break:break-all;">' + h(product.variants[0] ? product.variants[0].sku : '-') + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // Variants table
  result += '<section id="variants" class="section" style="background:#fafafa;">\n'
    + '<div class="container">\n'
    + '<div class="section-title">\n'
    + '<h2>Variants & Pricing</h2>\n'
    + '<p>Choose the variant that fits your needs.</p>\n'
    + '</div>\n'
    + '<div class="table-wrap">\n'
    + '<table>\n'
    + '<thead>\n'
    + '<tr>\n'
    + '<th>Variant</th>\n'
    + '<th>SKU</th>\n'
    + '<th>Stock</th>\n'
    + '<th>Price</th>\n'
    + '</tr>\n'
    + '</thead>\n'
    + '<tbody>\n'
    + variantRows
    + '</tbody>\n'
    + '</table>\n'
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // Full description
  result += '<section id="description" class="section">\n'
    + '<div class="container">\n'
    + '<div class="section-title">\n'
    + '<h2>Description</h2>\n'
    + '<p>Full details of ' + safeName + '</p>\n'
    + '</div>\n'
    + '<div class="desc-box">' + fullDescription + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // --- Interactive Checkout Preparation Section ---
  var initialPrice = firstVariant ? getDisplayPrice(firstVariant) : 0.00;
  var initialComparePrice = initialPrice * 1.5;

  var leftColumnHtml = '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100%; box-shadow: 0 8px 30px rgba(0,0,0,0.04); min-height: 420px;">\n'
    + '  <img id="left-variant-image" src="' + (firstVariant ? (firstVariant.image || product.images[0]) : product.images[0]) + '" alt="' + safeName + '" style="width: 100%; height: 100%; object-fit: cover; transition: all 0.3s ease;" />\n'
    + '</div>\n';

  var variantOptions = product.variants.map(function(v) {
    var vName = [v.color, v.size].filter(Boolean).join(' / ') || 'Default';
    return '<option value="' + v.cjId + '" data-price="' + getDisplayPrice(v).toFixed(2) + '" data-img="' + (v.image || product.images[0]) + '">' + h(vName) + ' - $' + getDisplayPrice(v).toFixed(2) + '</option>';
  }).join('');

  var rightColumnButtonHtml = '<button type="button" onclick="window.handleDirectCheckout(event)" class="btn btn-primary" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;">\n'
    + '&#128722; Order Now\n'
    + '</button>\n';

  var rightColumnCardHtml = '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 20px;">\n'
    + '  <div>\n'
    + '    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">Selected Variant</span>\n'
    + '    <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;">\n'
    + '      <span id="total-price-display" style="font-family:\'Outfit\',sans-serif; font-size: 32px; font-weight: 800; color: #FF6B35; line-height: 1;">$' + initialPrice.toFixed(2) + '</span>\n'
    + '      <span id="compare-price-display" style="font-size: 16px; color: #94a3b8; text-decoration: line-through; font-weight: 500;">$' + initialComparePrice.toFixed(2) + '</span>\n'
    + '    </div>\n'
    + '    <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Select Variant</label>\n'
    + '    <select id="variant-selector" onchange="window.updateVariantSelection(this)" style="width:100%; padding:12px 14px; border:2px solid #e2e8f0; border-radius:10px; font-size:14px; color:#1A1A2E; outline:none; font-family:inherit; transition:all 0.2s; cursor:pointer; font-weight:600; background:#f8fafc;" onfocus="this.style.borderColor=\'#FF6B35\';this.style.background=\'#ffffff\'" onblur="this.style.borderColor=\'#e2e8f0\';this.style.background=\'#f8fafc\'">\n'
    + variantOptions
    + '    </select>\n'
    + '  </div>\n'
    + '  \n'
    + '  <div>\n'
    + '    <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Quantity</label>\n'
    + '    <div style="display:flex; align-items:center; border:2px solid #e2e8f0; border-radius:10px; overflow:hidden; width:130px; background:#f8fafc;">\n'
    + '      <button type="button" onclick="window.changeQty(-1)" style="flex:1; padding:10px; border:none; background:transparent; font-size:16px; color:#64748b; cursor:pointer; font-weight:bold; transition:all 0.2s;" onmouseover="this.style.background=\'#e2e8f0\'" onmouseout="this.style.background=\'transparent\'">&minus;</button>\n'
    + '      <input type="number" id="qty-input" value="1" min="1" readonly style="width:40px; text-align:center; border:none; font-size:15px; font-weight:700; color:#1A1A2E; outline:none; background:transparent;" />\n'
    + '      <button type="button" onclick="window.changeQty(1)" style="flex:1; padding:10px; border:none; background:transparent; font-size:16px; color:#64748b; cursor:pointer; font-weight:bold; transition:all 0.2s;" onmouseover="this.style.background=\'#e2e8f0\'" onmouseout="this.style.background=\'transparent\'">+</button>\n'
    + '    </div>\n'
    + '  </div>\n'
    + '  \n'
    + rightColumnButtonHtml
    + '  \n'
    + '  <div style="display:flex; align-items:center; justify-content:center; gap:12px; opacity:0.85; margin-top:4px;">\n'
    + '    <span style="font-size:10px; color:#94a3b8; font-weight:600; display:inline-flex; align-items:center; gap:4px;">&#128274; SSL Secure</span>\n'
    + '    <span style="color:#e2e8f0;">|</span>\n'
    + '    <span style="font-size:10px; color:#94a3b8; font-weight:600; display:inline-flex; align-items:center; gap:4px;">🚚 Fast Delivery</span>\n'
    + '    <span style="color:#e2e8f0;">|</span>\n'
    + '    <span style="font-size:10px; color:#94a3b8; font-weight:600; display:inline-flex; align-items:center; gap:4px;">&#128179; All Cards</span>\n'
    + '  </div>\n'
    + '</div>\n';

  var checkoutSectionHtml = '<section id="checkout-section" class="section" style="scroll-margin-top: 80px; background: #ffffff;">\n'
    + '<div class="container">\n'
    + '  <div class="section-title">\n'
    + '    <h2>Select Your Variant & Order Now</h2>\n'
    + '    <p>Choose your size/color and proceed to secure checkout.</p>\n'
    + '  </div>\n'
    + '  <div class="grid-2" style="align-items: stretch;">\n'
    + '    <div>' + leftColumnHtml + '</div>\n'
    + '    <div>' + rightColumnCardHtml + '</div>\n'
    + '  </div>\n'
    + '</div>\n'
    + '</section>\n';

  result += checkoutSectionHtml;

  // ── Shipping Methods (from CJ API) ──────────────────────────────────────────
  var shippingMethodsHtml = '';
  if (product.shippingMethods && product.shippingMethods.length > 0) {
    var methodRows = product.shippingMethods.map(function(m) {
      var costDisplay = m.shippingCost > 0 ? '$' + m.shippingCost.toFixed(2) : 'FREE';
      var costColor = m.shippingCost > 0 ? '#1A1A2E' : '#10b981';
      return '<tr>'
        + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1A1A2E;font-weight:600;">' + h(m.shippingName) + '</td>'
        + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#64748b;">' + h(m.estimatedDays) + '</td>'
        + '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:' + costColor + ';">' + costDisplay + '</td>'
        + '</tr>';
    }).join('');

    shippingMethodsHtml = '<section class="section">\n'
      + '<div class="container">\n'
      + '<div class="section-title">\n'
      + '<h2>Shipping Options</h2>\n'
      + '<p>Real-time shipping rates to United States.</p>\n'
      + '</div>\n'
      + '<div class="table-wrap">\n'
      + '<table>\n'
      + '<thead>\n'
      + '<tr>\n'
      + '<th>Method</th>\n'
      + '<th>Estimated Delivery</th>\n'
      + '<th>Cost</th>\n'
      + '</tr>\n'
      + '</thead>\n'
      + '<tbody>\n'
      + methodRows
      + '</tbody>\n'
      + '</table>\n'
      + '</div>\n'
      + '<p style="text-align:center;margin-top:12px;font-size:12px;color:#94a3b8;">&#9432; Shipping costs and times are estimates. Actual rates may vary based on location and order size.</p>\n'
      + '</div>\n'
      + '</section>\n';
  }

  // Shipping & Return Policy
  result += '<section class="section" style="background:#fafafa;">\n'
    + '<div class="container">\n'
    + '<div class="section-title">\n'
    + '<h2>Shipping & Return Policy</h2>\n'
    + '<p>Important info before ordering.</p>\n'
    + '</div>\n'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">\n'
    + '<div class="policy-box">\n'
    + '<h4>' + benefitIcons['shipping'] + ' Shipping</h4>\n'
    + '<p>' + safeShipping + '</p>\n'
    + '</div>\n'
    + '<div class="policy-box">\n'
    + '<h4>' + benefitIcons['shield'] + ' Warranty & Returns</h4>\n'
    + '<p>' + safeReturn + '</p>\n'
    + '</div>\n'
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // Append shipping methods section after shipping policy
  result += shippingMethodsHtml;


  // FAQ section
  if (faqs.length > 0) {
    result += '<section id="faq" class="section">\n'
      + '<div class="container">\n'
      + '<div class="section-title">\n'
      + '<h2>Frequently Asked Questions</h2>\n'
      + '<p>Common questions about ' + safeName + '</p>\n'
      + '</div>\n'
      + '<div style="max-width:700px;margin:auto;">\n'
      + faqs.map(function(faq: { q: string; a: string }) {
        return '<div class="faq-item">\n'
          + '<div class="faq-q">' + h(faq.q) + '</div>\n'
          + '<div class="faq-a">' + h(faq.a) + '</div>\n'
          + '</div>';
      }).join('\n')
      + '</div>\n'
      + '</div>\n'
      + '</section>\n';
  }

  // Recommendations
  if (recsHtml) {
    result += '<section class="section" style="background:#fafafa;">\n'
      + '<div class="container">\n'
      + '<div class="section-title">\n'
      + '<h2>Other Products</h2>\n'
      + '<p>Check out our recommendations.</p>\n'
      + '</div>\n'
      + '<div class="grid-4">\n'
      + recsHtml
      + '</div>\n'
      + '</div>\n'
      + '</section>\n';
  }

  // Build WhatsApp message with product info & link (pre-filled for AI agent)
  var waMessage = 'Hi BangParjo AI, I\'m interested in ' + product.name + ' at ' + priceDisplay + '.\n\nProduct link: ' + productLink + '\n\nCan you help me order?';
  var waUrl = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(waMessage);

  // ── Trust Badges Section ─────────────────────────────────────────────────────
  result += '<section class="section" style="background:#ffffff;">\n'
    + '<div class="container">\n'
    + '<div class="section-title">\n'
    + '<h2>Why Shop With Us?</h2>\n'
    + '<p>Your satisfaction is our priority.</p>\n'
    + '</div>\n'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">\n'
    + trustBadges.map(function(b) {
      return '<div style="text-align:center;padding:24px 16px;border-radius:12px;border:1px solid #f1f5f9;transition:all 0.3s;" onmouseover="this.style.boxShadow=\'0 8px 30px rgba(0,0,0,0.06)\';this.style.borderColor=\'#FF6B35\'" onmouseout="this.style.boxShadow=\'none\';this.style.borderColor=\'#f1f5f9\'">\n'
        + '<div style="font-size:36px;margin-bottom:10px;line-height:1;">' + b.icon + '</div>\n'
        + '<h4 style="font-family:Outfit,-apple-system,sans-serif;font-size:14px;font-weight:700;color:#1A1A2E;margin-bottom:4px;">' + h(b.label) + '</h4>\n'
        + '<p style="font-size:12px;color:#64748b;">' + h(b.desc) + '</p>\n'
        + '</div>';
    }).join('\n')
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // ── Payment Methods Section ──────────────────────────────────────────────────
  result += '<section style="background:#fafafa;padding:32px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;">\n'
    + '<div class="container">\n'
    + '<div style="display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap;">\n'
    + '<span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">We Accept</span>\n'
    + '<span style="font-size:28px;line-height:1;" title="Visa/Mastercard">&#128179;</span>\n'
    + '<span style="font-size:28px;line-height:1;" title="PayPal">&#128666;</span>\n'
    + '<span style="font-size:28px;line-height:1;" title="Bank Transfer">&#127974;</span>\n'
    + '<span style="font-size:28px;line-height:1;" title="Apple Pay">&#128241;</span>\n'
    + '<span style="font-size:12px;color:#94a3b8;">&bull;</span>\n'
    + '<span style="font-size:12px;color:#10b981;font-weight:600;">&#128274; SSL Secure Checkout</span>\n'
    + '</div>\n'
    + '</div>\n'
    + '</section>\n';

  // ── WhatsApp CTA Section ─────────────────────────────────────────────────────
  result += '<section class="wa-section">\n'
    + '<div class="container">\n'
    + '<h2>Need Help? Chat with Us!</h2>\n'
    + '<p>Our AI assistant is ready to help you find the perfect product and answer any questions.</p>\n'
    + '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-wa" style="display:inline-flex;align-items:center;gap:10px;">&#128172; Chat on WhatsApp</a>\n'
    + '</div>\n'
    + '</section>\n';

  // ── Footer ───────────────────────────────────────────────────────────────────
  result += '<footer>\n'
    + '<div class="container">\n'
    + '<p>&copy; ' + year + ' BangParjo. All rights reserved. | <a href="' + storeBaseUrl + '/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a> | <a href="' + storeBaseUrl + '/terms" style="color:#94a3b8;text-decoration:underline;">Terms of Service</a></p>\n'
    + '</div>\n'
    + '</footer>\n';

  // ── Sticky WhatsApp Button ───────────────────────────────────────────────────
  result += '<div id="sticky-wa">\n'
    + '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer">&#128172; Chat on WhatsApp</a>\n'
    + '</div>\n';

  var jsProductData = {
    pid: product.cjId,
    productName: product.name,
    productNameEn: product.name,
    categoryName: '',
    images: product.images,
    coupon: null,
    variants: product.variants.map(function(v) {
      return {
        vid: v.cjId,
        sku: v.sku,
        name: [v.color, v.size].filter(Boolean).join(' / ') || 'Default',
        price: getDisplayPrice(v),
        baseCost: v.baseCost,
        image: v.image || product.images[0]
      };
    })
  };

  var scriptBlock = '<script>\n'
    + 'var productData = ' + JSON.stringify(jsProductData) + ';\n'
    + 'var selectedVariant = productData.variants[0];\n'
    + 'var quantity = 1;\n'
    + '\n'
    + 'window.updateVariantSelection = function(selectEl) {\n'
    + '  var vid = selectEl.value;\n'
    + '  selectedVariant = productData.variants.find(function(v) { return v.vid === vid; }) || productData.variants[0];\n'
    + '  updateDisplay();\n'
    + '};\n'
    + '\n'
    + 'window.changeQty = function(delta) {\n'
    + '  quantity += delta;\n'
    + '  if(quantity < 1) quantity = 1;\n'
    + '  document.getElementById("qty-input").value = quantity;\n'
    + '  updateDisplay();\n'
    + '};\n'
    + '\n'
    + 'function updateDisplay() {\n'
    + '  if(!selectedVariant) return;\n'
    + '  var total = selectedVariant.price * quantity;\n'
    + '  var displayEl = document.getElementById("total-price-display");\n'
    + '  if(displayEl) displayEl.textContent = "$" + total.toFixed(2);\n'
    + '  \n'
    + '  var compareEl = document.getElementById("compare-price-display");\n'
    + '  if(compareEl) compareEl.textContent = "$" + (selectedVariant.price * 1.5 * quantity).toFixed(2);\n'
    + '  \n'
    + '  var leftImgEl = document.getElementById("left-variant-image");\n'
    + '  if(leftImgEl) leftImgEl.src = selectedVariant.image;\n'
    + '  var leftNameEl = document.getElementById("left-variant-name");\n'
    + '  if(leftNameEl) leftNameEl.textContent = selectedVariant.name;\n'
    + '  \n'
    + '}\n'
    + '\n'
    + 'updateDisplay();\n'
    + '\n'
    + 'window.handleDirectCheckout = function(event) {\n'
    + '  if(!selectedVariant) return;\n'
    + '  \n'
    + '  // Direct to cart and checkout\n'
    + '  \n'
    + '  var item = {\n'
    + '    pid: productData.pid,\n'
    + '    selectedVid: selectedVariant.vid,\n'
    + '    selectedSku: selectedVariant.sku,\n'
    + '    selectedVariantName: selectedVariant.name,\n'
    + '    productName: productData.productName,\n'
    + '    productNameEn: productData.productNameEn,\n'
    + '    productImage: selectedVariant.image,\n'
    + '    bigImage: selectedVariant.image,\n'
    + '    sellPrice: selectedVariant.price,\n'
    + '    quantity: quantity,\n'
    + '    categoryName: productData.categoryName\n'
    + '  };\n'
    + '  \n'
    + '  var cart = [];\n'
    + '  try {\n'
    + '    var saved = localStorage.getItem("cart");\n'
    + '    if(saved) cart = JSON.parse(saved);\n'
    + '  } catch(e) {}\n'
    + '  \n'
    + '  var existingIdx = cart.findIndex(function(i) { return i.pid === item.pid && i.selectedVid === item.selectedVid; });\n'
    + '  if(existingIdx >= 0) {\n'
    + '    cart[existingIdx].quantity = quantity;\n'
    + '  } else {\n'
    + '    cart = [item];\n'
    + '  }\n'
    + '  localStorage.setItem("cart", JSON.stringify(cart));\n'
    + '  \n'
    + '  var btn = event.currentTarget;\n'
    + '  btn.innerHTML = "&#8987; Processing...";\n'
    + '  btn.style.opacity = "0.7";\n'
    + '  btn.disabled = true;\n'
    + '  \n'
    + '  var checkoutUrl = "/checkout?pid=" + encodeURIComponent(item.pid) + "&vid=" + encodeURIComponent(item.selectedVid) + "&qty=" + quantity;\n'
    + '  \n'
    + '  setTimeout(function() {\n'
    + '    window.location.href = checkoutUrl;\n'
    + '  }, 300);\n'
    + '};\n'
    + '</script>\n';

  result += scriptBlock;

  return result;
}
