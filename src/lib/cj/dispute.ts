import { cjFetch } from './client';
import type { CJResponse } from './client';

// ── Disputes ──────────────────────────────────────────────────────────────
export async function createDispute(params: {
  orderId: string;
  businessDisputeId: string;
  disputeReasonId: number;
  expectType: number;
  refundType: number;
  messageText: string;
  imageUrl?: string[];
  videoUrl?: string[];
  productInfoList: Array<{ lineItemId: string; quantity: number; price: number }>;
}) {
  return cjFetch<any>('/api2.0/v1/disputes/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDisputeList(params: {
  orderId?: string;
  disputeId?: string;
  orderNumber?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.orderId) query.set('orderId', params.orderId);
  if (params.disputeId) query.set('disputeId', params.disputeId);
  if (params.orderNumber) query.set('orderNumber', params.orderNumber);
  query.set('pageNum', (params.pageNum || 1).toString());
  query.set('pageSize', (params.pageSize || 10).toString());
  return cjFetch<any>(`/api2.0/v1/disputes/getDisputeList?${query.toString()}`);
}

export async function getDisputeProducts(orderId: string) {
  return cjFetch<any>(`/api2.0/v1/disputes/disputeProducts?orderId=${orderId}`);
}

export async function confirmDispute(params: {
  orderId: string;
  productInfoList: Array<{ lineItemId: string; quantity: number; price: number }>;
}) {
  return cjFetch<any>('/api2.0/v1/disputes/disputeConfirmInfo', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function cancelDispute(params: {
  orderId: string;
  disputeId: string;
}) {
  return cjFetch<any>('/api2.0/v1/disputes/cancel', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDisputeDetail(disputeId: string) {
  return cjFetch<any>(`/api2.0/v1/disputes/getDisputeDetail?disputeId=${disputeId}`);
}
