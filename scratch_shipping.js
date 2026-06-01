const { getShippingFeeBySku } = require('../src/lib/cj-api');

async function main() {
  const params = {
    products: [{ sku: 'CJCZ146033306FU', quantity: 1, price: 10 }],
    endCountryCode: 'US'
  };

  console.log("Calling getShippingFeeBySku...");
  const res = await getShippingFeeBySku(params);
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
