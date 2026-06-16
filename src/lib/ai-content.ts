/**
 * AI Content Generator — Landing Page Content
 *
 * Uses DeepSeek API to analyze a product and generate optimized
 * marketing content for the landing page template.
 * All content generated in ENGLISH for global market audience.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface AiLandingContent {
  shortProductName?: string;
  resellerOpportunity?: {
    title: string;
    description: string;
    profitMargin: string;
  };
  tagline: string;
  heroBadges: string[];
  benefits: Array<{ icon: string; title: string; desc: string }>;
  socialProof: { sold: string; rating: string; reviews: string };
  seoTitle: string;
  seoDescription: string;
  adCopy: string;
  faqs?: Array<{ q: string; a: string }>;
  shippingPolicy?: string;
  returnPolicy?: string;
  sections?: {
    benefitsTitle: string;
    benefitsSub: string;
    galleryTitle: string;
    gallerySub: string;
    detailsTitle: string;
    detailsSub: string;
    variantsTitle: string;
    variantsSub: string;
    descTitle: string;
    descSub: string;
    checkoutTitle: string;
    checkoutSub: string;
    shippingTitle: string;
    shippingSub: string;
    policyTitle: string;
    policySub: string;
  };
  ui?: {
    orderNow: string;
    inStock: string;
    outOfStock: string;
    preOrder: string;
    peopleViewing: string;
    leftInStock: string;
    timeLeft: string;
    sold: string;
    rating: string;
    reviews: string;
    productName: string;
    price: string;
    variants: string;
    totalStock: string;
    weight: string;
    sku: string;
    selectedVariant: string;
    selectVariant: string;
    quantity: string;
    sslSecure: string;
    fastDelivery: string;
    allCards: string;
    tableVariant: string;
    tableSku: string;
    tableStock: string;
    tablePrice: string;
    tableMethod: string;
    tableEst: string;
    tableCost: string;
    free: string;
    shippingDisclaimer: string;
    shippingTab: string;
    warrantyTab: string;
  };
}



interface ProductInput {
  name: string;
  description: string;
  images: string[];
  variants: Array<{
    color: string | null;
    size: string | null;
    sellingPrice: number;
    inventory: number;
  }>;
}

/**
 * Call DeepSeek API to generate landing page content for a product
 */
export async function generateLandingPageContent(
  product: ProductInput,
  lang: string = 'en'
): Promise<AiLandingContent> {
  const isIndo = lang.toLowerCase() === 'id';

  const minPrice = Math.min(...product.variants.map(v => v.sellingPrice));
  const maxPrice = Math.max(...product.variants.map(v => v.sellingPrice));
  const priceRange = minPrice === maxPrice
    ? `$${minPrice.toFixed(2)}`
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  const totalStock = product.variants.reduce((sum, v) => sum + v.inventory, 0);
  const variantCount = product.variants.length;

  const systemPrompt = isIndo
    ? `You are a professional e-commerce copywriter for dropshipping in Indonesia. CRITICAL: You MUST generate ALL text in INDONESIAN (Bahasa Indonesia) only. NEVER use any other language. Generate ONLY pure JSON, no markdown, no backticks, no explanations. Focus on benefits, emotional appeal, and conversion optimization.`
    : `You are a professional e-commerce copywriter for global dropshipping. CRITICAL: You MUST generate ALL text in ENGLISH only. NEVER use any other language. Generate ONLY pure JSON, no markdown, no backticks, no explanations. Focus on benefits, emotional appeal, and conversion optimization.`;

  const userPrompt = isIndo
    ? `Analyze this product and generate optimized marketing content for a social media landing page (Facebook/Instagram/TikTok/Google Ads). Write in INDONESIAN (Bahasa Indonesia) for an Indonesian audience.

PRODUCT DATA:
- Name: ${product.name}
- Description: ${product.description?.substring(0, 500) || 'No description available'}
- Price Range: ${priceRange}
- Variants: ${variantCount}
- Total Stock: ${totalStock}

INSTRUCTIONS — Focus on BENEFITS over features. Use simple, emotional, and persuasive language. Add urgency where appropriate.

Generate JSON with this exact structure:
{
  "shortProductName": "Nama produk yang singkat, bersih, profesional (tanpa kode spam, maks 5-6 kata)",
  "tagline": "Slogan pendek yang kuat (maks 8 kata) untuk bagian hero, berfokus pada konversi",
  "heroBadges": ["3 lencana pendek (maks 2 kata masing-masing), misal: Terlaris, Promo Hot, Stok Terbatas, Sedang Tren"],
  "benefits": [
    {"icon": "quality", "title": "judul benefit 1 (2-3 kata)", "desc": "deskripsi benefit singkat 8-12 kata, fokus pada keuntungan pembeli"},
    {"icon": "price", "title": "judul benefit 2", "desc": "deskripsi singkat"},
    {"icon": "shipping", "title": "judul benefit 3", "desc": "deskripsi singkat"}
  ],
  "resellerOpportunity": {
    "title": "Peluang Bisnis / Reseller",
    "description": "Beri penjelasan bahwa ini adalah barang impor berkualitas yang bisa digunakan sendiri, ATAU sangat menguntungkan jika dijual kembali (reseller/dropship). Jelaskan kenapa ini peluang bagus.",
    "profitMargin": "Estimasi keuntungan (misal: Margin Profit 50-100%!)"
  },
  "socialProof": {
    "sold": "estimasi unit terjual yang realistis (misal: 2.500+)",
    "rating": "penilaian bintang (4.5 - 5.0)",
    "reviews": "jumlah ulasan (misal: 850+)"
  },
  "seoTitle": "Judul SEO maks 60 karakter untuk meta tag",
  "seoDescription": "Deskripsi SEO maks 160 karakter untuk meta tag",
  "adCopy": "Salinan iklan media sosial 1-2 kalimat pendek yang menarik, maks 150 karakter",
  "faqs": [
    {"q": "Pertanyaan FAQ 1 terkait produk ini", "a": "Jawaban singkat yang jelas maks 20 kata"},
    {"q": "Pertanyaan FAQ 2", "a": "Jawaban 2"}
  ],
  "shippingPolicy": "Kebijakan pengiriman 1-2 kalimat. Estimasi waktu pengiriman.",
  "returnPolicy": "Kebijakan pengembalian/garansi 1-2 kalimat. Syarat dan ketentuan.",
  "sections": {
    "benefitsTitle": "Judul spesifik produk, cth: Mengapa Memilih Sepatu Ini?",
    "benefitsSub": "Subjudul pendek",
    "galleryTitle": "Judul Galeri",
    "gallerySub": "Subjudul Galeri",
    "detailsTitle": "Judul Detail Spesifik Produk",
    "detailsSub": "Subjudul detail",
    "variantsTitle": "Judul Varian",
    "variantsSub": "Subjudul Varian",
    "descTitle": "Judul Deskripsi Spesifik",
    "descSub": "Subjudul Deskripsi",
    "checkoutTitle": "Judul Checkout, cth: Pilih Ukuran & Pesan",
    "checkoutSub": "Subjudul Checkout",
    "shippingTitle": "Opsi Pengiriman",
    "shippingSub": "Tarif & Waktu",
    "policyTitle": "Kebijakan & Garansi",
    "policySub": "Info Penting"
  },
  "ui": {
    "orderNow": "Teks tombol pesan, cth: Pesan Sekarang",
    "inStock": "Tersedia",
    "outOfStock": "Habis",
    "preOrder": "Pre-Order",
    "peopleViewing": "orang sedang melihat",
    "leftInStock": "tersisa",
    "timeLeft": "tersisa",
    "sold": "Terjual",
    "rating": "Penilaian",
    "reviews": "Ulasan",
    "productName": "Nama Produk",
    "price": "Harga",
    "variants": "Varian",
    "totalStock": "Total Stok",
    "weight": "Berat",
    "sku": "SKU",
    "selectedVariant": "Varian Dipilih",
    "selectVariant": "Pilih Varian",
    "quantity": "Kuantitas",
    "sslSecure": "Aman SSL",
    "fastDelivery": "Kirim Cepat",
    "allCards": "Semua Kartu",
    "tableVariant": "Varian",
    "tableSku": "SKU",
    "tableStock": "Stok",
    "tablePrice": "Harga",
    "tableMethod": "Metode",
    "tableEst": "Estimasi",
    "tableCost": "Biaya",
    "free": "GRATIS",
    "shippingDisclaimer": "Biaya dan waktu pengiriman adalah estimasi.",
    "shippingTab": "Pengiriman",
    "warrantyTab": "Garansi & Retur"
  }
}

ALL TEXT MUST BE IN INDONESIAN (BAHASA INDONESIA).
Pure JSON only, no markdown, no backticks.`
    : `Analyze this product and generate optimized marketing content for a social media landing page (Facebook/Instagram/TikTok/Google Ads). Write in ENGLISH for a global audience.

PRODUCT DATA:
- Name: ${product.name}
- Description: ${product.description?.substring(0, 500) || 'No description available'}
- Price Range: ${priceRange}
- Variants: ${variantCount}
- Total Stock: ${totalStock}

INSTRUCTIONS — Focus on BENEFITS over features. Use simple, emotional language. Add urgency where appropriate.

Generate JSON with this exact structure:
{
  "shortProductName": "Clean, short, professional product name (remove spammy keywords, max 5-6 words)",
  "tagline": "Short powerful slogan (max 8 words) for hero section, focus on conversion",
  "heroBadges": ["3 short badges (max 2 words each), e.g.: Best Seller, Hot Deal, Limited Stock, Trending"],
  "benefits": [
    {"icon": "quality", "title": "benefit title 1 (2-3 words)", "desc": "short benefit description 8-12 words, focus on what customer gains"},
    {"icon": "price", "title": "benefit title 2", "desc": "short description"},
    {"icon": "shipping", "title": "benefit title 3", "desc": "short benefit description"}
  ],
  "resellerOpportunity": {
    "title": "Business / Reseller Opportunity",
    "description": "Explain that this is a premium imported item perfect for personal use, OR highly profitable to resell. Persuade visitors to buy and start selling.",
    "profitMargin": "Estimated profit (e.g.: 50-100% Profit Margin!)"
  },
  "socialProof": {
    "sold": "realistic units sold estimate (e.g., 2,500+)",
    "rating": "star rating (4.5 - 5.0)",
    "reviews": "review count (e.g., 850+)"
  },
  "seoTitle": "SEO title max 60 characters for meta tag",
  "seoDescription": "SEO description max 160 characters for meta tag",
  "adCopy": "Social media ad copy 1-2 short compelling sentences, max 150 chars",
  "faqs": [
    {"q": "FAQ question 1 related to this product", "a": "Clear short answer max 20 words"},
    {"q": "FAQ question 2", "a": "Answer 2"}
  ],
  "shippingPolicy": "Shipping policy 1-2 sentences. Estimated delivery time and carrier.",
  "returnPolicy": "Return/warranty policy 1-2 sentences. Terms and conditions.",
  "sections": {
    "benefitsTitle": "Product specific title, e.g., Why Choose These Boots?",
    "benefitsSub": "Short subtitle",
    "galleryTitle": "Gallery Title",
    "gallerySub": "Gallery Subtitle",
    "detailsTitle": "Product specific details title",
    "detailsSub": "Details subtitle",
    "variantsTitle": "Variants Title",
    "variantsSub": "Variants subtitle",
    "descTitle": "Specific Description Title",
    "descSub": "Description subtitle",
    "checkoutTitle": "Checkout Title, e.g., Select Size & Order",
    "checkoutSub": "Checkout Subtitle",
    "shippingTitle": "Shipping Options",
    "shippingSub": "Rates & Times",
    "policyTitle": "Policy & Warranty",
    "policySub": "Important Info"
  },
  "ui": {
    "orderNow": "Button text, e.g., Order Now",
    "inStock": "In Stock",
    "outOfStock": "Out of Stock",
    "preOrder": "Pre-Order",
    "peopleViewing": "people viewing now",
    "leftInStock": "left in stock",
    "timeLeft": "left",
    "sold": "Sold",
    "rating": "Rating",
    "reviews": "Reviews",
    "productName": "Product Name",
    "price": "Price",
    "variants": "Variants",
    "totalStock": "Total Stock",
    "weight": "Weight",
    "sku": "SKU",
    "selectedVariant": "Selected Variant",
    "selectVariant": "Select Variant",
    "quantity": "Quantity",
    "sslSecure": "SSL Secure",
    "fastDelivery": "Fast Delivery",
    "allCards": "All Cards",
    "tableVariant": "Variant",
    "tableSku": "SKU",
    "tableStock": "Stock",
    "tablePrice": "Price",
    "tableMethod": "Method",
    "tableEst": "Estimated",
    "tableCost": "Cost",
    "free": "FREE",
    "shippingDisclaimer": "Shipping costs and times are estimates.",
    "shippingTab": "Shipping",
    "warrantyTab": "Warranty & Returns"
  }
}

ALL TEXT MUST BE IN ENGLISH.
Pure JSON only, no markdown, no backticks.`;


  // Try DeepSeek
  if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'sk-your-deepseek-api-key-here') {
    try {
      const result = await callDeepSeek(systemPrompt, userPrompt, product.name, isIndo);
      if (result) return result;
    } catch (err) {
      console.warn('[AI Content] DeepSeek failed:', err);
    }
  }

  return getFallbackContent(product.name, isIndo);
}


/**
 * Call DeepSeek chat completions API
 */
async function callDeepSeek(systemPrompt: string, userPrompt: string, productName: string, isIndo: boolean): Promise<AiLandingContent | null> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[AI Content] DeepSeek API error:', response.status, errText);
    return null;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';

  return parseAiResponse(text, productName, isIndo);
}

/**
 * Parse AI response JSON into AiLandingContent
 */
function parseAiResponse(text: string, productName: string, isIndo: boolean): AiLandingContent | null {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<AiLandingContent>;
    const fallback = getFallbackContent(productName, isIndo);
    return {
      shortProductName: parsed.shortProductName || fallback.shortProductName,
      tagline: parsed.tagline || fallback.tagline,
      resellerOpportunity: parsed.resellerOpportunity || fallback.resellerOpportunity,
      heroBadges: Array.isArray(parsed.heroBadges) ? parsed.heroBadges.slice(0, 3) : fallback.heroBadges,
      benefits: Array.isArray(parsed.benefits) ? parsed.benefits.slice(0, 3) : fallback.benefits,
      socialProof: parsed.socialProof || fallback.socialProof,
      seoTitle: parsed.seoTitle || fallback.seoTitle,
      seoDescription: parsed.seoDescription || fallback.seoDescription,
      adCopy: parsed.adCopy || fallback.adCopy,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs.slice(0, 5) : undefined,
      shippingPolicy: parsed.shippingPolicy || undefined,
      returnPolicy: parsed.returnPolicy || undefined,
      sections: { ...fallback.sections, ...(parsed.sections || {}) } as any,
      ui: { ...fallback.ui, ...(parsed.ui || {}) } as any,
    };
  } catch {
    console.error('[AI Content] Failed to parse AI response as JSON:', text.substring(0, 200));
    return null;
  }
}



/**
 * Backward-compatible exports for social-post routes
 * These were previously defined in this file and are still imported by
 * src/app/api/cron/social-post/route.ts and src/app/api/social/post/route.ts
 */
export async function generateProductContent(product: any): Promise<string> {
  return product?.name || 'Product';
}

export function calculateMarkupPrice(baseCost: number, markupPercent?: number): { sellingPrice: number; discount: number } {
  const percent = markupPercent || 30;
  const sellingPrice = baseCost * (1 + percent / 100);
  return { sellingPrice, discount: 0 };
}

/**
 * Fallback content when AI is unavailable
 */
function getFallbackContent(productName: string, isIndo: boolean): AiLandingContent {
  let fallback: AiLandingContent;
  if (isIndo) {
    fallback = {
      shortProductName: productName.split(' ').slice(0, 5).join(' '),
      tagline: `${productName} — Harga Terbaik, Kirim Cepat`,
      heroBadges: ['Terlaris', 'Pengiriman Cepat', 'Harga Terbaik'],
      benefits: [
        { icon: 'quality', title: 'Kualitas Premium', desc: 'Produk berkualitas tinggi yang memenuhi standar internasional. Kepuasan terjamin.' },
        { icon: 'price', title: 'Garansi Harga Terbaik', desc: 'Dapatkan harga terbaik langsung dari supplier. Tanpa markup perantara.' },
        { icon: 'shipping', title: 'Pengiriman Cepat Global', desc: 'Pengiriman global dengan pelacakan real-time.' },
      ],
      resellerOpportunity: {
        title: 'Peluang Bisnis Menguntungkan',
        description: 'Produk impor berkualitas tinggi ini tidak hanya cocok untuk dipakai sendiri, tapi juga sangat potensial untuk dijual kembali. Dapatkan harga langsung pabrik dan raih keuntungan besar!',
        profitMargin: 'Potensi Margin 50% - 150%'
      },
      socialProof: { sold: '2.500+', rating: '4.8', reviews: '850+' },
      seoTitle: `${productName} — Belanja Global di BangParjo`,
      seoDescription: `Beli ${productName} dengan harga terbaik. Kualitas premium, pengiriman cepat ke seluruh dunia, dan garansi uang kembali. Belanja sekarang di BangParjo.`,
      adCopy: `${productName} dengan harga yang tak tertandingi! ✓ Kualitas premium ✓ Pengiriman cepat ✓ Garansi 30 hari. Pesan sekarang!`,
      shippingPolicy: 'Pengiriman internasional cepat 7-21 hari kerja dengan nomor pelacakan.',
      returnPolicy: 'Garansi kepuasan 100%. Kembalikan dalam waktu 7 hari jika produk tidak memuaskan untuk pengembalian dana penuh.',
      sections: {
        benefitsTitle: 'Mengapa Memilih Produk Ini?',
        benefitsSub: 'Keuntungan yang Anda dapatkan.',
        galleryTitle: 'Galeri Produk',
        gallerySub: 'Lihat produk dari berbagai sudut.',
        detailsTitle: 'Detail Produk',
        detailsSub: 'Info lengkap tentang ' + productName,
        variantsTitle: 'Varian & Harga',
        variantsSub: 'Pilih varian yang sesuai dengan kebutuhan Anda.',
        descTitle: 'Deskripsi',
        descSub: 'Detail lengkap dari ' + productName,
        checkoutTitle: 'Pilih Varian & Pesan Sekarang',
        checkoutSub: 'Pilih ukuran/warna Anda dan lanjutkan ke checkout aman.',
        shippingTitle: 'Opsi Pengiriman',
        shippingSub: 'Tarif pengiriman real-time.',
        policyTitle: 'Kebijakan Pengiriman & Retur',
        policySub: 'Info penting sebelum memesan.'
      },
      ui: {
        orderNow: 'Pesan Sekarang',
        inStock: 'Tersedia',
        outOfStock: 'Habis',
        preOrder: 'Pre-Order',
        peopleViewing: 'orang sedang melihat',
        leftInStock: 'tersisa',
        timeLeft: 'tersisa',
        sold: 'Terjual',
        rating: 'Rating',
        reviews: 'Ulasan',
        productName: 'Nama Produk',
        price: 'Harga',
        variants: 'Varian',
        totalStock: 'Total Stok',
        weight: 'Berat',
        sku: 'SKU',
        selectedVariant: 'Varian Terpilih',
        selectVariant: 'Pilih Varian',
        quantity: 'Kuantitas',
        sslSecure: 'Aman SSL',
        fastDelivery: 'Kirim Cepat',
        allCards: 'Semua Kartu',
        tableVariant: 'Varian',
        tableSku: 'SKU',
        tableStock: 'Stok',
        tablePrice: 'Harga',
        tableMethod: 'Metode',
        tableEst: 'Estimasi',
        tableCost: 'Biaya',
        free: 'GRATIS',
        shippingDisclaimer: 'Biaya dan waktu pengiriman adalah estimasi.',
        shippingTab: 'Pengiriman',
        warrantyTab: 'Garansi & Retur'
      }
    };
    return fallback;
  }

  return {
    shortProductName: productName.split(' ').slice(0, 5).join(' '),
    tagline: `${productName} — Best Price, Global Shipping`,
    heroBadges: ['Best Seller', 'Global Shipping', 'Best Price'],
    benefits: [
      { icon: 'quality', title: 'Premium Quality', desc: 'High-quality products meeting international standards. Satisfaction guaranteed.' },
      { icon: 'price', title: 'Best Price Guarantee', desc: 'Get the best prices directly from suppliers. No middleman markup.' },
      { icon: 'shipping', title: 'Fast Worldwide Shipping', desc: 'Global delivery with real-time tracking.' },
    ],
    resellerOpportunity: {
      title: 'Profitable Business Opportunity',
      description: 'This premium imported product is perfect for personal use, but also highly profitable for reselling. Get direct factory pricing and maximize your profit margins!',
      profitMargin: '50% - 150% Profit Potential'
    },
    socialProof: { sold: '2,500+', rating: '4.8', reviews: '850+' },
    seoTitle: `${productName} — Shop Global at BangParjo`,
    seoDescription: `Buy ${productName} at the best price. Premium quality, fast worldwide shipping, and money-back guarantee. Shop now at BangParjo.`,
    adCopy: `${productName} at unbeatable prices! ✓ Premium quality ✓ Fast global shipping ✓ 30-day returns. Order now!`,
    shippingPolicy: 'Fast worldwide shipping in 7-21 business days with tracking number.',
    returnPolicy: '100% satisfaction guarantee. Return within 7 days if not satisfied for a full refund.',
    sections: {
      benefitsTitle: 'Why Choose This Product?',
      benefitsSub: "Benefits you'll get.",
      galleryTitle: 'Product Gallery',
      gallerySub: 'See the product from every angle.',
      detailsTitle: 'Product Details',
      detailsSub: 'Complete info about ' + productName,
      variantsTitle: 'Variants & Pricing',
      variantsSub: 'Choose the variant that fits your needs.',
      descTitle: 'Description',
      descSub: 'Full details of ' + productName,
      checkoutTitle: 'Select Your Variant & Order Now',
      checkoutSub: 'Choose your size/color and proceed to secure checkout.',
      shippingTitle: 'Shipping Options',
      shippingSub: 'Real-time shipping rates.',
      policyTitle: 'Shipping & Return Policy',
      policySub: 'Important info before ordering.'
    },
    ui: {
      orderNow: 'Order Now',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      preOrder: 'Pre-Order',
      peopleViewing: 'people viewing now',
      leftInStock: 'left in stock',
      timeLeft: 'left',
      sold: 'Sold',
      rating: 'Rating',
      reviews: 'Reviews',
      productName: 'Product Name',
      price: 'Price',
      variants: 'Variants',
      totalStock: 'Total Stock',
      weight: 'Weight',
      sku: 'SKU',
      selectedVariant: 'Selected Variant',
      selectVariant: 'Select Variant',
      quantity: 'Quantity',
      sslSecure: 'SSL Secure',
      fastDelivery: 'Fast Delivery',
      allCards: 'All Cards',
      tableVariant: 'Variant',
      tableSku: 'SKU',
      tableStock: 'Stock',
      tablePrice: 'Price',
      tableMethod: 'Method',
      tableEst: 'Estimated Delivery',
      tableCost: 'Cost',
      free: 'FREE',
      shippingDisclaimer: 'Shipping costs and times are estimates.',
      shippingTab: 'Shipping',
      warrantyTab: 'Warranty & Returns'
    }
  };
}
