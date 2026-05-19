/**
 * OpenClaw Client — Backward Compatibility Layer
 *
 * Re-exports all functions from the new openclaw-client module.
 * This file exists for backward compatibility with existing imports.
 *
 * New code should import directly from '@/lib/openclaw-client'
 */

import {
  sendCustomWA,
  notifyOrderCreated,
  notifyPaymentReceived,
  notifyShipped,
  notifyContactAdmin,
  notifyCJOrderUpdate,
  notifyTrackingUpdate,
  notifyLowStock,
  notifyWebhookRegister,
} from './openclaw-client';

export {
  sendCustomWA,
  notifyOrderCreated,
  notifyPaymentReceived,
  notifyShipped,
  notifyContactAdmin,
  notifyCJOrderUpdate,
  notifyTrackingUpdate,
  notifyLowStock,
  notifyWebhookRegister,
};

export default {
  sendCustomWA,
  notifyOrderCreated,
  notifyPaymentReceived,
  notifyShipped,
  notifyContactAdmin,
  notifyCJOrderUpdate,
  notifyTrackingUpdate,
  notifyLowStock,
  notifyWebhookRegister,
};
