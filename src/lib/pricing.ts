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
  markupPct: 0,
  marginTiers: [],
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

