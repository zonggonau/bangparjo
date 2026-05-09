let cachedRate: number = 16000;
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // Cache for 1 hour

export async function getExchangeRateIDR(): Promise<number> {
  const now = Date.now();
  if (now - lastFetch < CACHE_DURATION) {
    return cachedRate;
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR');
    const data = await res.json();
    if (data && data.rates && data.rates.IDR) {
      cachedRate = data.rates.IDR;
      lastFetch = now;
      console.log(`[Currency] Updated USD to IDR rate: ${cachedRate}`);
    }
    return cachedRate;
  } catch (error) {
    console.error('[Currency] Failed to fetch real-time rate, using fallback:', error);
    return cachedRate; // Return last known or fallback
  }
}
