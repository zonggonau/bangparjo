import { cjFetch } from './client';
import type { CJResponse } from './client';

// ── Types ─────────────────────────────────────────────────────────────────
export interface CJShippingMethod {
  logisticName: string;
  logisticPrice: number;
  logisticPriceCn?: number;
  logisticAging: string;
  taxesFee?: number;
  totalPostageFee?: number;
  logisticId?: string;
  rawCjPrice?: number;
}

export interface CJPartnerFreightRequest {
  startCountryCode?: string;
  endCountryCode: string;
  weight: number;
  volume?: number;
  totalGoodsAmount?: number;
  productProp?: string[];
}

export interface CJTrackInfo {
  trackingNumber: string;
  logisticName: string;
  trackingFrom: string;
  trackingTo: string;
  deliveryDay: string;
  deliveryTime: string;
  trackingStatus: string;
  lastMileCarrier: string;
  lastTrackNumber: string;
}

// ── Shipping ──────────────────────────────────────────────────────────────
export async function getShippingFeeBySku(params: {
  products: Array<{ sku: string; quantity: number; weight?: number; price?: number }>;
  endCountryCode: string;
  startCountryCode?: string;
}): Promise<CJResponse<CJShippingMethod[]>> {
  const reqDTOS = [{
    srcAreaCode: params.startCountryCode || 'CN',
    destAreaCode: params.endCountryCode,
    weight: params.products.reduce((sum, p) => sum + (p.weight || 200) * p.quantity, 0),
    volume: 0.001,
    totalGoodsAmount: params.products.reduce((sum, p) => sum + (p.price || 10) * p.quantity, 0),
    productProp: ['COMMON'],
    freightTrialSkuList: params.products.map(p => ({
      sku: p.sku,
      skuQuantity: p.quantity,
      skuWeight: p.weight || 200,
    })),
    skuList: params.products.map(p => p.sku),
    platforms: ['API'],
  }];

  try {
    const res = await cjFetch<any>('/api2.0/v1/logistic/freightCalculateTip', {
      method: 'POST',
      body: JSON.stringify({ reqDTOS }),
      timeout: 10000,
      maxRetries: 0,
    });

    if (res.success && res.data && res.data.length > 0) {
      const methods: CJShippingMethod[] = res.data.map((item: any) => ({
        logisticName: item.option?.enName || item.channel?.enName || 'Unknown',
        logisticPrice: item.postage || item.discountFee || 0,
        logisticPriceCn: item.postageCNY || item.discountFeeCNY || 0,
        logisticAging: item.arrivalTime || 'Unknown',
        taxesFee: item.taxesFee,
        totalPostageFee: item.postage || item.discountFee || 0,
      }));
      return { success: true, result: true, data: methods, code: 200, message: 'Success', requestId: 'sku' };
    }
    
    if (!res.success) {
      console.warn(`[Shipping SKU API] Failed: ${res.message}.`);
    }
    return res;
  } catch (err) {
    console.warn('[Shipping SKU API] Error:', err);
    return { success: false, result: false, message: 'Error', data: null as any, code: 500, requestId: '' };
  }
}

export async function getShippingFee(params: {
  products: Array<{ vid: string; quantity: number }>;
  endCountryCode: string;
  startCountryCode?: string;
}): Promise<CJResponse<CJShippingMethod[]>> {
  try {
    const res = await cjFetch<CJShippingMethod[]>('/api2.0/v1/logistic/freightCalculate', {
      method: 'POST',
      body: JSON.stringify({
        startCountryCode: params.startCountryCode || 'CN',
        endCountryCode: params.endCountryCode,
        products: params.products,
      }),
      timeout: 10000,
      maxRetries: 0,
    });
    
    if (!res.success) {
       console.warn(`[Shipping API] Failed: ${res.message}. Returning fallback.`);
       return {
         success: true,
         result: true,
         data: [{
           logisticName: 'Standard Shipping (Fallback)',
           logisticPrice: 5.00,
           logisticAging: '15-25',
           logisticId: 'fallback'
         }] as any,
         code: 200,
         message: 'Fallback',
         requestId: 'fallback'
       };
    }

    return res;
  } catch (err) {
    return {
      success: true,
      result: true,
      data: [{
        logisticName: 'Economy Shipping',
        logisticPrice: 4.50,
        logisticAging: '20-30',
        logisticId: 'fallback-err'
      }] as any,
      code: 200,
      message: 'Network Fallback',
      requestId: 'error-fallback'
    };
  }
}

// ── Tracking ──────────────────────────────────────────────────────────────
export async function getDetailedTracking(cjOrderId: string) {
  return cjFetch<any>(`/v1/logistic/getLogisticsTrack?orderId=${cjOrderId}`);
}

export async function getTrackingInfo(orderId: string) {
  return cjFetch<any>(`/api2.0/v1/shopping/order/getOrderDetail?orderId=${orderId}`);
}

export async function getOrderList(params: {
  pageNum?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const query = new URLSearchParams({
    pageNum: (params.pageNum || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.status && { status: params.status }),
  });
  return cjFetch(`/api2.0/v1/shopping/order/list?${query.toString()}`);
}

// ── Logistics: Calculate ───────────────────────────────────────────────────
export async function partnerFreightCalculate(params: CJPartnerFreightRequest): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/logistic/partnerFreightCalculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSupplierLogisticsTemplate(params: {
  productId: string;
  countryCode: string;
  quantity?: number;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/logistic/getSupplierLogisticsTemplate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Logistics: Tracking ────────────────────────────────────────────────────
export async function getTrackInfo(trackNumbers: string | string[]): Promise<CJResponse<CJTrackInfo[]>> {
  const params = Array.isArray(trackNumbers) ? trackNumbers : [trackNumbers];
  const query = params.map(t => `trackNumber=${encodeURIComponent(t)}`).join('&');
  return cjFetch<CJTrackInfo[]>(`/api2.0/v1/logistic/getTrackInfo?${query}`);
}

export async function trackInfo(trackNumbers: string | string[]): Promise<CJResponse<CJTrackInfo[]>> {
  const params = Array.isArray(trackNumbers) ? trackNumbers : [trackNumbers];
  const query = params.map(t => `trackNumber=${encodeURIComponent(t)}`).join('&');
  return cjFetch<CJTrackInfo[]>(`/api2.0/v1/logistic/trackInfo?${query}`);
}
