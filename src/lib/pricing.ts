import { prisma } from './db';

export interface MarginTier {
  min: number;
  max: number | null; // null means infinity
  pct: number;
}

export interface SocialLink {
  platform: string;  // e.g. 'facebook', 'instagram', 'tiktok', 'whatsapp', 'youtube'
  label: string;     // display label
  url: string;       // full URL
  icon: string;      // emoji icon
}

export interface StoreSettings {
  markupPct: number;          // legacy fallback
  marginTiers?: MarginTier[]; // tiered markup
  freeShippingThreshold: number;
  shippingMarkup: number;     // Percentage shipping markup added to live shipping (markup ongkir CJ dalam %)
  shippingBufferPct: number;  // Extra % buffer di atas ongkir CJ (untuk antisipasi selisih estimasi vs aktual)
  currencySymbol: string;
  storeName: string;
  adminEmail: string;
  taxPct: number;
  cjPayType?: number; // 2: Balance, 3: Manual
  socialLinks?: SocialLink[];
  address?: string;
  phone?: string;
  workingHours?: string;
  faqContent?: string;
  returnsContent?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroImage?: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  markupPct: 0,
  marginTiers: [],
  freeShippingThreshold: 1000,
  shippingMarkup: 15,        // Markup persentase di atas ongkir CJ (default 15% untuk buffer aman)
  shippingBufferPct: 20,     // Tambahan buffer 20% di atas ongkir CJ agar tidak rugi saat estimasi meleset
  currencySymbol: 'USD',
  storeName: 'BangParjo Shop',
  adminEmail: 'hello@bangparjo.com',
  taxPct: 0,
  cjPayType: 3,
  address: '123 Merdeka Street, Jakarta, Indonesia',
  phone: '+62 21 1234-5678',
  workingHours: 'Mon - Sat: 08:00 - 20:00 (GMT+7)',
  faqContent: '',
  returnsContent: '',
  socialLinks: [
    { platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/bangparjo', icon: '📘' },
    { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/bangparjo', icon: '📸' },
    { platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@bangparjo', icon: '🎵' },
    { platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/6281355315427', icon: '💬' },
  ],
  heroHeadline: 'Discover Premium Dropshipping Products',
  heroSubheadline: 'High quality items at unbeatable prices, shipped directly to your door.',
  heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop',
};

/**
 * Server-only: Fetch settings directly from Prisma
 */
export async function getDBStoreSettings(): Promise<StoreSettings> {
  if (typeof window !== 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const dbSettings = await prisma.storeSetting.findMany();
    
    const dbTiers = await prisma.marginTier.findMany({ 
      orderBy: { min: 'asc' } 
    });

    const settings: any = { ...DEFAULT_SETTINGS };
    dbSettings.forEach(s => {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch {
        settings[s.key] = s.value;
      }
    });

    if (dbTiers.length > 0) {
      settings.marginTiers = dbTiers.map((t: any) => ({
        min: t.min,
        max: t.max,
        pct: t.pct
      }));
    }
    return settings as StoreSettings;
  } catch (error) {
    console.error('Error fetching DB settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function getStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const s = localStorage.getItem('admin_settings');
    if (s) {
      const parsed = JSON.parse(s);
      if (!parsed.marginTiers) parsed.marginTiers = DEFAULT_SETTINGS.marginTiers;
      const settings = { ...DEFAULT_SETTINGS, ...parsed };
      return settings;
    }
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function calculateFinalPrice(basePrice: number | string, customSettings?: StoreSettings): number {
  const price = typeof basePrice === 'number' ? basePrice : parseFloat(String(basePrice));
  if (isNaN(price)) return 0;

  const settings = customSettings || getStoreSettings();
  
  if (settings.marginTiers && settings.marginTiers.length > 0) {
    // Find applicable tier
    for (const tier of settings.marginTiers) {
      if (price >= tier.min && (tier.max === null || price < tier.max)) {
        return price * (1 + tier.pct / 100);
      }
    }
  }

  // Fallback to flat markup
  return price * (1 + settings.markupPct / 100);
}

export function calculateShippingFee(baseShipping: number, subtotal: number, customSettings?: StoreSettings): number {
  const settings = customSettings || getStoreSettings();
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
    return 0;
  }
  
  // Opsi 1: percentage markup (shippingMarkup)
  const markupPct = settings.shippingMarkup || 0;
  const withPercentageMarkup = baseShipping * (1 + markupPct / 100);
  
  // Opsi 2: percentage buffer (shippingBufferPct) — berguna untuk produk berbobot tinggi
  // yang ongkir aktual CJ-nya bisa lebih mahal dari estimasi
  const bufferPct = settings.shippingBufferPct || 0;
  const withPctBuffer = baseShipping * (1 + bufferPct / 100);
  
  // Ambil nilai TERBESAR dari kedua metode untuk memastikan tidak rugi
  return Math.max(withPercentageMarkup, withPctBuffer);
}



