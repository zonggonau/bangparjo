// Analisa perbedaan harga antara blog ($5.33) dan checkout ($4.64)

// Data dari DB
const baseCost = 2.75;
const markupPct = 35;
const couponValue = 20; // RAINBOOT20 = 20% OFF

// Perhitungan di BLOG (blog-templates.ts)
function getDisplayPrice(sellingPrice) {
    const marginPrice = sellingPrice * (1 + markupPct / 100);
    // Inflasi dengan coupon
    return marginPrice / (1 - couponValue / 100);
}

console.log('=== PERHITUNGAN BLOG ===');
console.log('baseCost:', baseCost);
console.log('marginPrice (base + 35%):', baseCost * 1.35);
console.log('inflated (dengan coupon 20%):', getDisplayPrice(baseCost));
console.log('');

// Coba cari tahu darimana $5.33 berasal
// 5.33 / 0.80 = 6.6625 (marginPrice)
// 6.6625 / 1.35 = 4.935 (baseCost)
// Atau 5.33 * 0.80 = 4.264 (marginPrice)
// 4.264 / 1.35 = 3.158 (baseCost)

console.log('=== MENCARI ASAL $5.33 ===');
// Kemungkinan 1: sellingPrice sudah termasuk margin
const sellingPriceAfterMargin = 2.75 * 1.35; // 3.7125
console.log('Jika sellingPrice = marginPrice (3.71):');
console.log('  inflated =', 3.7125 / 0.80, '=', (3.7125 / 0.80).toFixed(2));

// Kemungkinan 2: margin 35% diterapkan 2x
console.log('\nJika margin 35% diterapkan 2x:');
const doubleMargin = 2.75 * 1.35 * 1.35;
console.log('  doubleMargin =', doubleMargin);
console.log('  inflated =', doubleMargin / 0.80, '=', (doubleMargin / 0.80).toFixed(2));

// Kemungkinan 3: coupon 20% diterapkan sebagai diskon dari marginPrice (bukan inflasi)
console.log('\nJika coupon = diskon langsung dari marginPrice:');
const marginPrice = 2.75 * 1.35;
console.log('  marginPrice =', marginPrice);
console.log('  setelah diskon 20% =', marginPrice * 0.80);
console.log('  harga tampil =', marginPrice);

// Kemungkinan 4: fakeOriginalPrice dari ProductView
console.log('\nfakeOriginalPrice di ProductView (finalPrice * 1.35):');
const finalPrice = 2.75 * 1.35;
console.log('  finalPrice =', finalPrice);
console.log('  fakeOriginalPrice =', finalPrice * 1.35);

// Kemungkinan 5: sellingPrice dari variant Female High Blue ($1.87)
console.log('\nVariant Female High Blue ($1.87):');
const fbMargin = 1.87 * 1.35;
console.log('  marginPrice =', fbMargin);
console.log('  inflated =', fbMargin / 0.80, '=', (fbMargin / 0.80).toFixed(2));

// Coba cari kombinasi yang menghasilkan $5.33
console.log('\n=== MENCARI KOMBINASI ===');
for (let base = 1.00; base <= 5.00; base += 0.01) {
    const margin = base * 1.35;
    const inflated = margin / 0.80;
    if (Math.abs(inflated - 5.33) < 0.01) {
        console.log(`baseCost ${base.toFixed(2)} → margin ${margin.toFixed(2)} → inflated ${inflated.toFixed(2)}`);
    }
}

// Coba dengan margin berbeda
console.log('\n=== DENGAN MARKUP BERBEDA ===');
for (let pct = 10; pct <= 100; pct += 5) {
    const margin = 2.75 * (1 + pct / 100);
    const inflated = margin / 0.80;
    if (Math.abs(inflated - 5.33) < 0.05) {
        console.log(`markup ${pct}% → margin ${margin.toFixed(2)} → inflated ${inflated.toFixed(2)}`);
    }
}

// Coba dengan coupon berbeda
console.log('\n=== DENGAN COUPON BERBEDA ===');
for (let cpn = 5; cpn <= 50; cpn += 1) {
    const margin = 2.75 * 1.35;
    const inflated = margin / (1 - cpn / 100);
    if (Math.abs(inflated - 5.33) < 0.05) {
        console.log(`coupon ${cpn}% → margin ${margin.toFixed(2)} → inflated ${inflated.toFixed(2)}`);
    }
}
