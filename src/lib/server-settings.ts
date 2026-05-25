/**
 * Server-only cached version of getDBStoreSettings.
 * Uses Redis for caching via getOrSet (with in-memory fallback).
 * Imported only by server components / API routes.
 */
import { prisma } from './db';
import { DEFAULT_SETTINGS, type StoreSettings } from './pricing';
import { getOrSet } from './redis';

const CACHE_KEY = 'store:settings';
const CACHE_TTL = 3600; // 1 hour

/**
 * Fetch store settings from DB — cached via Redis.
 * Replaces Next.js built-in 'use cache' directive.
 */
export async function getCachedStoreSettings(): Promise<StoreSettings> {
  return getOrSet(CACHE_KEY, fetchStoreSettingsFromDB, CACHE_TTL);
}

/**
 * Internal fetcher — reads store settings and margin tiers from Prisma.
 */
async function fetchStoreSettingsFromDB(): Promise<StoreSettings> {
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
    settings.freeShippingThreshold = 1000;
    return settings as StoreSettings;
  } catch (error) {
    console.error('Error fetching DB settings:', error);
    return DEFAULT_SETTINGS;
  }
}
