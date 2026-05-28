import { getAccessTokenServer, BASE_URL } from './src/lib/cj-api';

async function main() {
  const payload = {
    "email": "cristoperzonggonau@gmail.com",
    "payType": 3,
    "products": [
      {
        "sku": "CJYD289344601AZ",
        "vid": "2605160811101610100",
        "quantity": 1
      }
    ],
    "orderNumber": "ORD-1779812549717-test3",
    "shippingZip": "98851",
    "logisticName": "CJPacket Liquid Line",
    "shippingCity": "Nabire",
    "shippingPhone": "+6281355315427",
    "fromCountryCode": "CN",
    "shippingAddress": "Nabire Barat",
    "shippingCountry": "Indonesia",
    "shippingProvince": "Nabire",
    "shippingCountryCode": "ID",
    "shippingCustomerName": "Kristovedus Zonggonau",
    "platform": "Api",
    "shopLogisticsType": 2
  };

  const token = await getAccessTokenServer();
  const url = `https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2`;
  console.log("Calling API:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Raw Response:", res.status, text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

main();
