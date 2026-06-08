import { extractColor, extractSize, parseVariants } from '../src/lib/variant-utils';

// Test cases
const testCases = [
  // Simple format: Color-Size
  "Sapphire Blue-M",
  "Sapphire Blue-2XL",
  "Light Gray-S",
  "Green-S",
  "Orange Red-XL",
  "Wine Red-3XL",
  "Black-8number",
  "Black-12number",
  
  // Multi-dash format: Pattern-Type-Volume
  "Cow-Cup less sleeve-500ML",
  "Cow-Have a cup cover-500ML",
  "Flowers Bid Farewell-Cup less sleeve-500ML",
  "Flowers Bid Farewell-Have a cup cover-500ML",
  "Pudding-Cup less sleeve-500ML",
  "Pudding-Have a cup cover-500ML",
  "Sugar Ball-Cup less sleeve-500ML",
  "Sugar Ball-Have a cup cover-500ML",
  
  // Edge cases
  "Default",
  "Red",
  "Silver-42",
  "Camel-45 Men",
  "Light Blue-6XL",
];

console.log("=== Individual parse tests ===\n");
for (const tc of testCases) {
  const color = extractColor(tc);
  const size = extractSize(tc);
  console.log(`  "${tc}" → color="${color}", size="${size}"`);
}

console.log("\n=== Grouped parse test (cup variants) ===\n");
const cupVariants = [
  { vid: "1", variantKey: "Cow-Cup less sleeve-500ML" },
  { vid: "2", variantKey: "Cow-Have a cup cover-500ML" },
  { vid: "3", variantKey: "Flowers Bid Farewell-Cup less sleeve-500ML" },
  { vid: "4", variantKey: "Flowers Bid Farewell-Have a cup cover-500ML" },
  { vid: "5", variantKey: "Pudding-Cup less sleeve-500ML" },
  { vid: "6", variantKey: "Pudding-Have a cup cover-500ML" },
  { vid: "7", variantKey: "Sugar Ball-Cup less sleeve-500ML" },
  { vid: "8", variantKey: "Sugar Ball-Have a cup cover-500ML" },
];

const result = parseVariants(cupVariants);
console.log("Colors:", result.colors);
console.log("Sizes:", result.sizes);
console.log("Grouped:", JSON.stringify(result.grouped, null, 2));

console.log("\n=== Grouped parse test (t-shirt variants) ===\n");
const shirtVariants = [
  { vid: "1", variantKey: "Sapphire Blue-S" },
  { vid: "2", variantKey: "Sapphire Blue-M" },
  { vid: "3", variantKey: "Sapphire Blue-L" },
  { vid: "4", variantKey: "Sapphire Blue-XL" },
  { vid: "5", variantKey: "Sapphire Blue-2XL" },
  { vid: "6", variantKey: "Light Gray-S" },
  { vid: "7", variantKey: "Light Gray-M" },
  { vid: "8", variantKey: "Light Gray-L" },
  { vid: "9", variantKey: "Light Gray-XL" },
  { vid: "10", variantKey: "Light Gray-2XL" },
];

const result2 = parseVariants(shirtVariants);
console.log("Colors:", result2.colors);
console.log("Sizes:", result2.sizes);
console.log("Grouped:", JSON.stringify(result2.grouped, null, 2));
