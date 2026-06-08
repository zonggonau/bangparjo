/**
 * Utility functions for parsing variant color and size.
 * 
 * The CJ API stores variant info in a combined format.
 * The `color` field in DB currently stores "ColorName-Size" (e.g., "Sapphire Blue-M")
 * We parse it by splitting on the last "-" to extract proper color and size.
 */

/** Known size patterns (case-insensitive) */
const SIZE_PATTERNS = [
  // Standard letter sizes (including 2XL, 2X, etc.)
  /^(\d*)(XS|S|M|L|XL|XXL|XXXL|XXXXL)$/i,
  // Numeric sizes (shoe sizes like 36-48, sometimes with Men/Women)
  /^(\d{2,3})\s*(Men|Women)?$/i,
  // Numeric sizes with "number" suffix (e.g., "8number", "12number")
  /^(\d{1,3})number$/i,
  // Volume sizes
  /^(\d+)\s*(ml|g|kg|oz|l|pcs)$/i,
  // One Size
  /^One\s*Size$/i,
];

/**
 * Extract color name from the combined variant key.
 * 
 * Handles two formats:
 * 1. Simple: "ColorName-Size" (e.g., "Sapphire Blue-M") — split by last "-"
 * 2. Multi-dash: "Pattern-Type-Volume" (e.g., "Cow-Cup less sleeve-500ML") 
 *    — first segment is color/pattern, rest is size
 * 
 * Strategy:
 * - If there are multiple dashes AND the last segment looks like a size,
 *   check if the first segment alone could be the color name.
 * - For simple cases (single dash), split by last dash.
 */
export function extractColor(combinedColor: string | null | undefined): string {
  if (!combinedColor || combinedColor === 'Default') return 'Default';
  
  const firstDash = combinedColor.indexOf('-');
  const lastDash = combinedColor.lastIndexOf('-');
  
  if (lastDash > 0) {
    const possibleSize = combinedColor.substring(lastDash + 1);
    
    // Check if the part after the last "-" looks like a size
    if (looksLikeSize(possibleSize)) {
      // Multi-dash case: check if first segment is the color
      if (firstDash !== lastDash && firstDash > 0) {
        const firstSegment = combinedColor.substring(0, firstDash);
        // If first segment doesn't look like a size itself, it's the color
        if (!looksLikeSize(firstSegment)) {
          return firstSegment;
        }
      }
      // Simple case: everything before last dash is the color
      return combinedColor.substring(0, lastDash);
    }
  }
  
  return combinedColor;
}

/**
 * Extract size from the combined variant key.
 * 
 * For multi-dash formats like "Cow-Cup less sleeve-500ML",
 * the size is everything after the first dash: "Cup less sleeve-500ML"
 * For simple formats like "Sapphire Blue-M", size is just "M"
 */
export function extractSize(combinedColor: string | null | undefined): string {
  if (!combinedColor || combinedColor === 'Default') return '';
  
  const firstDash = combinedColor.indexOf('-');
  const lastDash = combinedColor.lastIndexOf('-');
  
  if (lastDash > 0) {
    const possibleSize = combinedColor.substring(lastDash + 1);
    
    if (looksLikeSize(possibleSize)) {
      // Multi-dash case: everything after first dash is the size
      if (firstDash !== lastDash && firstDash > 0) {
        const firstSegment = combinedColor.substring(0, firstDash);
        if (!looksLikeSize(firstSegment)) {
          return combinedColor.substring(firstDash + 1);
        }
      }
      // Simple case: just the last segment
      return possibleSize;
    }
  }
  
  return '';
}

/**
 * Check if a string looks like a size designation.
 */
function looksLikeSize(str: string): boolean {
  return SIZE_PATTERNS.some(pattern => pattern.test(str.trim()));
}

/**
 * Parse variants from a product and return organized color/size groups.
 * Returns:
 * - colors: unique color names
 * - sizes: unique size names  
 * - grouped: map of color -> available sizes for that color
 * - flat: all variants with parsed color and size
 */
export function parseVariants(variants: any[]) {
  const colorMap = new Map<string, Set<string>>();
  const allSizes = new Set<string>();
  const allColors = new Set<string>();
  
  const parsed = variants.map(v => {
    const combinedColor = v.color || v.variantKey || '';
    const color = extractColor(combinedColor);
    const size = extractSize(combinedColor);
    
    // Fallback: if no size found, use variantNameEn or size field
    const finalSize = size || v.size || '';
    
    allColors.add(color);
    if (finalSize) allSizes.add(finalSize);
    
    if (!colorMap.has(color)) {
      colorMap.set(color, new Set());
    }
    if (finalSize) {
      colorMap.get(color)!.add(finalSize);
    }
    
    return { ...v, parsedColor: color, parsedSize: finalSize };
  });

  return {
    colors: [...allColors].sort(),
    sizes: [...allSizes].sort(sizeSorter),
    grouped: Object.fromEntries(
      [...colorMap.entries()].map(([k, v]) => [k, [...v].sort(sizeSorter)])
    ),
    variants: parsed,
  };
}

/**
 * Sort sizes in a logical order (XS, S, M, L, XL, XXL, 3XL, ..., numeric).
 */
function sizeSorter(a: string, b: string): number {
  // Normalize size strings: "2XL" -> "xxl", "3XL" -> "3xl", etc.
  const normalizeSize = (s: string): string => {
    return s.toLowerCase().trim().replace(/\s+/g, '');
  };
  
  const sizeOrder: Record<string, number> = {
    'xs': 1, 's': 2, 'm': 3, 'l': 4,
    'xl': 5, 'xxl': 6, 'xxxl': 7, 'xxxxl': 8,
    '2xl': 6, '3xl': 7, '4xl': 8, '5xl': 9, '6xl': 10, '7xl': 11, '8xl': 12,
  };
  
  const aNorm = normalizeSize(a);
  const bNorm = normalizeSize(b);
  
  const aOrder = sizeOrder[aNorm];
  const bOrder = sizeOrder[bNorm];
  
  if (aOrder && bOrder) return aOrder - bOrder;
  if (aOrder) return -1;
  if (bOrder) return 1;
  
  // Numeric comparison (for shoe sizes like "38", "39", "8number", etc.)
  const aNum = parseInt(aNorm.replace('number', ''));
  const bNum = parseInt(bNorm.replace('number', ''));
  if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
  if (!isNaN(aNum)) return -1;
  if (!isNaN(bNum)) return 1;
  
  return a.localeCompare(b);
}

/**
 * Get a color swatch hex value for common color names.
 * Returns null if color is not recognized.
 */
export function getColorSwatch(colorName: string): string | null {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080',
    'gold': '#FFD700',
    'golden': '#FFD700',
    'silver': '#C0C0C0',
    'navy': '#000080',
    'dark blue': '#00008B',
    'light blue': '#ADD8E6',
    'light gray': '#D3D3D3',
    'light grey': '#D3D3D3',
    'light pink': '#FFB6C1',
    'light purple': '#DDA0DD',
    'sapphire blue': '#0F52BA',
    'wine red': '#722F37',
    'coffee': '#6F4E37',
    'peacock green': '#00A86B',
    'bean green': '#8FBC8F',
    'fluorescent green': '#39FF14',
    'orange red': '#FF4500',
    'camouflage': '#4A5D23',
    'camel': '#C19A6B',
    'grass green': '#7CFC00',
    'dark green': '#006400',
  };
  
  return colorMap[colorName.toLowerCase().trim()] || null;
}
