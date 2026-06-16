import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_signature = "export function renderProductTemplate(product: ProductData, waNumber?: string, baseUrl?: string): string {"
new_signature = "export function renderProductTemplate(product: ProductData, waNumber?: string, baseUrl?: string, lang: string = 'en'): string {"
content = content.replace(old_signature, new_signature)

old_getDisplayPrice = """  function getDisplayPrice(v: any): number {
    if (!v) return 0;
    // Prioritas: sellingPrice (sudah include margin) → baseCost fallback
    if (typeof v === 'object') return v.sellingPrice || v.baseCost || 0;
    return v;
  }"""

new_getDisplayPrice = """  function getDisplayPrice(v: any): number {
    if (!v) return 0;
    // Prioritas: sellingPrice (sudah include margin) → baseCost fallback
    if (typeof v === 'object') return v.sellingPrice || v.baseCost || 0;
    return v;
  }

  var isIndo = lang.toLowerCase() === 'id';
  var exchangeRate = 16000;

  function formatCurrency(usdValue: number) {
    if (isIndo) {
      var idr = Math.round(usdValue * exchangeRate);
      return 'Rp ' + idr.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
    }
    return '$' + usdValue.toFixed(2);
  }"""

content = content.replace(old_getDisplayPrice, new_getDisplayPrice)

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
