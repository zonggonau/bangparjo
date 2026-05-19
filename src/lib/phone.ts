/**
 * Phone Number Utility
 *
 * Normalizes phone numbers from any country to international format (without +).
 * Handles various input formats:
 *   - Local: 08123456789 (Indonesia)
 *   - International with +: +628123456789
 *   - International without +: 628123456789
 *   - With dashes/spaces: 0812-3456-789, +1 (555) 123-4567
 *   - US/Canada: (555) 123-4567, +1 555 123 4567
 */

/**
 * Normalize a phone number to international format (no leading +, no spaces/dashes).
 *
 * Rules:
 * 1. Strip all non-digit characters
 * 2. If starts with '00', replace with '+' equivalent (00 → international prefix)
 * 3. If starts with country code (e.g., 62, 1, 44), keep as-is
 * 4. If starts with '0', it's a local number — we try to detect the country
 *    from the shipping country code, but default to Indonesia (62)
 *
 * @param phone - Raw phone number from user input
 * @param countryCode - ISO 2-letter country code (e.g., 'ID', 'US', 'GB')
 * @returns Normalized phone number (e.g., '628123456789', '12025551234')
 */
export function normalizePhone(phone: string, countryCode?: string): string {
  // Step 1: Strip all non-digit characters
  let cleaned = phone.replace(/[^0-9]/g, '');

  if (!cleaned) return '';

  // Step 2: Handle 00 prefix (international call prefix used in many countries)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.replace(/^00+/, '');
  }

  // Step 3: If it already starts with a valid country code (1-9), assume it's international
  // Country codes are 1-3 digits, starting with 1-9
  // Common patterns: 1 (US/CA), 62 (ID), 44 (UK), 86 (CN), 91 (IN), etc.
  if (cleaned.length >= 10 && !cleaned.startsWith('0')) {
    // Already looks like international format (e.g., 62812..., 1415...)
    return cleaned;
  }

  // Step 4: Handle local numbers starting with '0'
  if (cleaned.startsWith('0')) {
    const cc = getCountryCode(countryCode);
    cleaned = cc + cleaned.substring(1);
  }

  // Step 5: If number is too short (less than 10 digits after all processing),
  // it's probably invalid
  if (cleaned.length < 10) {
    return cleaned; // Return as-is, let the caller handle errors
  }

  return cleaned;
}

/**
 * Get the international dialing code for a country.
 * Falls back to Indonesia (62) if unknown.
 */
function getCountryCode(countryCode?: string): string {
  const countryMap: Record<string, string> = {
    // Asia
    ID: '62',   // Indonesia
    MY: '60',   // Malaysia
    SG: '65',   // Singapore
    PH: '63',   // Philippines
    TH: '66',   // Thailand
    VN: '84',   // Vietnam
    CN: '86',   // China
    TW: '886',  // Taiwan
    HK: '852',  // Hong Kong
    JP: '81',   // Japan
    KR: '82',   // South Korea
    IN: '91',   // India
    PK: '92',   // Pakistan
    BD: '880',  // Bangladesh
    LK: '94',   // Sri Lanka
    NP: '977',  // Nepal
    MM: '95',   // Myanmar
    KH: '855',  // Cambodia
    LA: '856',  // Laos
    MN: '976',  // Mongolia

    // Middle East
    AE: '971',  // UAE
    SA: '966',  // Saudi Arabia
    QA: '974',  // Qatar
    KW: '965',  // Kuwait
    BH: '973',  // Bahrain
    OM: '968',  // Oman
    JO: '962',  // Jordan
    LB: '961',  // Lebanon
    IL: '972',  // Israel
    TR: '90',   // Turkey
    IR: '98',   // Iran
    IQ: '964',  // Iraq

    // Europe
    GB: '44',   // United Kingdom
    DE: '49',   // Germany
    FR: '33',   // France
    IT: '39',   // Italy
    ES: '34',   // Spain
    PT: '351',  // Portugal
    NL: '31',   // Netherlands
    BE: '32',   // Belgium
    CH: '41',   // Switzerland
    AT: '43',   // Austria
    SE: '46',   // Sweden
    NO: '47',   // Norway
    DK: '45',   // Denmark
    FI: '358',  // Finland
    PL: '48',   // Poland
    CZ: '420',  // Czech Republic
    SK: '421',  // Slovakia
    HU: '36',   // Hungary
    RO: '40',   // Romania
    BG: '359',  // Bulgaria
    GR: '30',   // Greece
    IE: '353',  // Ireland
    RU: '7',    // Russia
    UA: '380',  // Ukraine

    // North America
    US: '1',    // United States
    CA: '1',    // Canada
    MX: '52',   // Mexico

    // South America
    BR: '55',   // Brazil
    AR: '54',   // Argentina
    CL: '56',   // Chile
    CO: '57',   // Colombia
    PE: '51',   // Peru

    // Oceania
    AU: '61',   // Australia
    NZ: '64',   // New Zealand

    // Africa
    ZA: '27',   // South Africa
    NG: '234',  // Nigeria
    EG: '20',   // Egypt
    KE: '254',  // Kenya
    MA: '212',  // Morocco
  };

  const code = countryCode?.toUpperCase() || '';
  return countryMap[code] || '62'; // Default to Indonesia
}

/**
 * Format a phone number for display (e.g., +62 812-3456-7890)
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // Try to detect country code
  if (cleaned.startsWith('62')) {
    // Indonesian format: +62 812-3456-7890
    const area = cleaned.substring(2, 5);
    const rest = cleaned.substring(5);
    const part1 = rest.substring(0, 4);
    const part2 = rest.substring(4, 8);
    return `+62 ${area}-${part1}-${part2}`;
  }

  if (cleaned.startsWith('1')) {
    // US/Canada format: +1 (555) 123-4567
    const area = cleaned.substring(1, 4);
    const part1 = cleaned.substring(4, 7);
    const part2 = cleaned.substring(7, 11);
    return `+1 (${area}) ${part1}-${part2}`;
  }

  // Generic international format
  return `+${cleaned}`;
}
