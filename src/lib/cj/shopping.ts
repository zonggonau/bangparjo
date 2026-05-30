import { cjFetch } from './client';
import type { CJResponse } from './client';

// ── Types ─────────────────────────────────────────────────────────────────
export interface CJBalance {
  balance: number;
  balanceStr: string;
  currency: string;
}

export interface WebhookSetting {
  type: 'ENABLE' | 'CANCEL';
  callbackUrls: string[];
}

export interface CJSetting {
  key: string;
  value: string;
  description?: string;
}

// ── Orders ────────────────────────────────────────────────────────────────
export async function createOrder(orderData: {
  orderNumber: string;
  shippingZip?: string;
  shippingCountry: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingPhone?: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingAddress2?: string;
  logisticName?: string;
  fromCountryCode?: string;
  payType?: number; 
  products: Array<{ vid?: string; sku?: string; quantity: number; storeLineItemId?: string }>;
}) {
  return cjFetch<any>('/v1/shopping/order/createOrderV2', {
    method: 'POST',
    body: JSON.stringify({
      fromCountryCode: orderData.fromCountryCode || 'CN',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...orderData,
      payType: orderData.payType || 3, // Default to 3 if not provided
    }),
  });
}

export async function createOrderV1(orderData: {
  orderNumber: string;
  shippingZip?: string;
  shippingCountry: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingPhone?: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingAddress2?: string;
  logisticName?: string;
  fromCountryCode?: string;
  payType?: number;
  products: Array<{ vid?: string; sku?: string; quantity: number }>;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/order/createOrder', {
    method: 'POST',
    body: JSON.stringify({
      fromCountryCode: orderData.fromCountryCode || 'CN',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...orderData,
      payType: orderData.payType || 3,
    }),
  });
}

export async function createOrderV3(orderData: {
  orderNumber: string;
  shippingZip?: string;
  shippingCountry: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingPhone?: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingAddress2?: string;
  shippingEmail?: string;
  logisticName?: string;
  fromCountryCode?: string;
  payType?: number;
  remark?: string;
  warehouseId?: string;
  products: Array<{
    vid?: string;
    sku?: string;
    quantity: number;
    storeLineItemId?: string;
    warehouseId?: string;
  }>;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/order/createOrderV3', {
    method: 'POST',
    body: JSON.stringify({
      fromCountryCode: orderData.fromCountryCode || 'CN',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...orderData,
      payType: orderData.payType || 3,
    }),
  });
}

/**
 * Order Confirmation (PATCH)
 * Endpoint: /api2.0/v1/shopping/order/confirmOrder
 * Confirm and submit an order that was created in draft mode.
 */
export async function confirmOrder(params: {
  orderId: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/order/confirmOrder', {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

export async function deleteOrder(cjOrderId: string) {
  return cjFetch<any>(`/api2.0/v1/shopping/order/deleteOrder?orderId=${encodeURIComponent(cjOrderId)}`, {
    method: 'DELETE',
  });
}

// ── Shopping: Payment ──────────────────────────────────────────────────────
export async function getBalance(): Promise<CJResponse<CJBalance>> {
  return cjFetch<CJBalance>('/api2.0/v1/shopping/pay/getBalance');
}

export async function payBalance(params: {
  orderNumber: string;
  payPassword?: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/pay/payBalance', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function payBalanceV2(params: {
  orderNumbers: string[];
  payPassword?: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/pay/payBalanceV2', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function getSettings(): Promise<CJResponse<CJSetting[]>> {
  return cjFetch<CJSetting[]>('/api2.0/v1/setting/get');
}

// ── Webhook APIs ──────────────────────────────────────────────────────────
export async function setWebhook(params: {
  product: WebhookSetting;
  stock: WebhookSetting;
  order: WebhookSetting;
  logistics: WebhookSetting;
}) {
  return cjFetch<any>('/api2.0/v1/webhook/set', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
