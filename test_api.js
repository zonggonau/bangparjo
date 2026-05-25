const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getShippingFeeBySku, getShippingFee } = require('./.next/server/app/api/shipping-rates/route.js'); // Not easily requireable.

// Let's just use fetch directly.
async function testCJ() {
  const tokenRes = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.data.accessToken;
  console.log("Token:", token.substring(0, 10));

  // Test freightCalculateTip
  const tipRes = await fetch("https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculateTip", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
    body: JSON.stringify({
      reqDTOS: [{
        srcAreaCode: "CN", destAreaCode: "US", weight: 200, volume: 0.001,
        totalGoodsAmount: 10, productProp: ["COMMON"],
        freightTrialSkuList: [{ sku: "CJCZ146033306FU", skuQuantity: 1, skuWeight: 200 }],
        skuList: ["CJCZ146033306FU"], platforms: ["API"]
      }]
    })
  });
  console.log("TipRes:", await tipRes.text());
  
  // Test freightCalculate
  const fcRes = await fetch("https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
    body: JSON.stringify({
      startCountryCode: "CN", endCountryCode: "US",
      products: [{ vid: "CJCZ146033306FU", quantity: 1 }] // Assuming VID and SKU might be same for test
    })
  });
  console.log("FcRes:", await fcRes.text());
}

testCJ().catch(console.error);
