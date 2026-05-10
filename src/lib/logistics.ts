import { getShippingFee, CJShippingMethod } from './cj-api';

export interface ShippingRate extends CJShippingMethod {
  estimatedDays: string;
  formattedPrice: string;
}

/**
 * Fetches the best shipping options for a specific item to a target country.
 */
export async function getBestShippingRates(
  vid: string,
  quantity: number = 1,
  countryCode: string = 'ID'
): Promise<ShippingRate[]> {
  try {
    const res = await getShippingFee({
      products: [{ vid, quantity }],
      endCountryCode: countryCode,
    });

    if (!res.success || !res.data) {
      return [];
    }

    // Map ke format yang lebih ramah UI
    return res.data.map(method => ({
      ...method,
      estimatedDays: method.logisticAging,
      formattedPrice: `USD ${method.logisticPrice.toFixed(2)}`,
    }));
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return [];
  }
}

/**
 * Helper to retrieve the cheapest available shipping method.
 */
export async function getCheapestShipping(vid: string, quantity: number = 1) {
  const rates = await getBestShippingRates(vid, quantity);
  if (rates.length === 0) return null;
  return rates.reduce((prev, curr) => (prev.logisticPrice < curr.logisticPrice ? prev : curr));
}
