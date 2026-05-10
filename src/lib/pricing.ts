import { prisma } from './db';

export interface MarginTier {
  min: number;
  max: number | null; // null means infinity
  pct: number;
}

export interface StoreSettings {
  markupPct: number;          // legacy fallback
  marginTiers?: MarginTier[]; // tiered markup
  freeShippingThreshold: number;
  shippingMarkup: number;     // Extra fee added to live shipping
  currencySymbol: string;
  storeName: string;
  adminEmail: string;
  taxPct: number;
  cjPayType?: number; // 2: Balance, 3: Manual
}

export const DEFAULT_SETTINGS: StoreSettings = {
  markupPct: 30,
  marginTiers: [
    { min: 0, max: 1, pct: 70 },
    { min: 1, max: 2, pct: 60 },
    { min: 2, max: 3, pct: 40 },
    { min: 3, max: 4, pct: 35 },
    { min: 4, max: 5, pct: 30 },
    { min: 5, max: 7, pct: 25 },
    { min: 7, max: 10, pct: 20 },
    { min: 10, max: 20, pct: 18 },
    { min: 20, max: 30, pct: 16 },
    { min: 30, max: 40, pct: 10 },
    { min: 40, max: 50, pct: 8 },
    { min: 50, max: 100, pct: 6 },
    { min: 100, max: 500, pct: 5 },
    { min: 500, max: null, pct: 3 },
  ],
  freeShippingThreshold: 50,
  shippingMarkup: 2.00,
  currencySymbol: 'USD',
  storeName: 'BangParjo Shop',
  adminEmail: '',
  taxPct: 0,
  cjPayType: 3,
};

/**
 * Server-only: Fetch settings directly from Prisma
 */
export async function getDBStoreSettings(): Promise<StoreSettings> {
  if (typeof window !== 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const dbSettings = await prisma.storeSetting.findMany();
    
    // Check if property exists to avoid crash during re-generation
    const dbTiers = (prisma as any).pricingTier 
      ? await (prisma as any).pricingTier.findMany({ orderBy: { minPrice: 'asc' } })
      : [];

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
        min: t.minPrice,
        max: t.maxPrice,
        pct: t.marginPercent
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
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
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
  return baseShipping + (settings.shippingMarkup || 0);
}

