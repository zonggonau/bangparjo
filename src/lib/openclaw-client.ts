/**
 * OpenClaw Client — WhatsApp Notification Gateway
 *
 * Bridge between website events (CJ orders, shipping, stock) and
 * OpenClaw which runs on the VPS to send WhatsApp messages.
 *
 * OpenClaw runs at: OPENCLAW_URL (default: http://127.0.0.1:18789)
 * Auth: OPENCLAW_TOKEN
 */

const TOKEN = process.env.OPENCLAW_TOKEN || '';
const GATEWAY = process.env.OPENCLAW_URL || 'http://127.0.0.1:18789';
const ADMIN_WA = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980';

// ── Low-Level Send ──────────────────────────────────────────────────────────

interface SendWAParams {
  target: string;   // Phone number, format: 628xxx (no +)
  message: string;  // Supports WhatsApp markdown (*bold*, _italic_)
}

/**
 * Kirim pesan WhatsApp via OpenClaw's sessions_send tool
 */
async function sendWA({ target, message }: SendWAParams) {
  if (!TOKEN) {
    console.warn('[OpenClaw] OPENCLAW_TOKEN not configured');
    return { success: false, error: 'Token not configured' };
  }

  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'sessions_send',
        args: {
          sessionKey: target,
          message: message,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[OpenClaw] API Error:', res.status, text);
      return { success: false, error: `API Error ${res.status}: ${text}` };
    }

    const data = await res.json();
    console.log('[OpenClaw] WA sent to', target);
    return { success: true, data };
  } catch (error: any) {
    console.error('[OpenClaw] Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ── Admin Notifications ──────────────────────────────────────────────────────

/**
 * Notify admin when a new order is placed
 */
export async function notifyOrderCreated(order: {
  orderNum: string;
  customerName?: string | null;
  totalAmount?: number | null;
  status: string;
  customerEmail?: string | null;
}) {
  const msg = [
    `🛒 *NEW ORDER*`,
    ``,
    `Order: #${order.orderNum}`,
    `Customer: ${order.customerName || '-'}`,
    `Email: ${order.customerEmail || '-'}`,
    `Total: $${(order.totalAmount || 0).toFixed(2)}`,
    `Status: ${order.status}`,
    ``,
    `🔗 https://bangparjo.com/admin/orders/${order.orderNum}`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

/**
 * Notify admin when payment is received
 */
export async function notifyPaymentReceived(order: {
  orderNum: string;
  totalAmount?: number | null;
  paymentMethod?: string | null;
}) {
  const msg = [
    `💳 *PAYMENT RECEIVED*`,
    ``,
    `Order: #${order.orderNum}`,
    `Amount: $${(order.totalAmount || 0).toFixed(2)}`,
    `Method: ${order.paymentMethod || '-'}`,
    ``,
    `🔗 https://bangparjo.com/admin/orders/${order.orderNum}`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

/**
 * Notify admin when order is shipped
 */
export async function notifyShipped(order: {
  orderNum: string;
  trackingNumber?: string | null;
  logisticName?: string;
}) {
  const msg = [
    `📦 *ORDER SHIPPED*`,
    ``,
    `Order: #${order.orderNum}`,
    `Courier: ${order.logisticName || '-'}`,
    `Tracking: ${order.trackingNumber || '-'}`,
    ``,
    `🔗 https://bangparjo.com/admin/orders/${order.orderNum}`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

/**
 * Notify admin of new support ticket
 */
export async function notifyContactAdmin(ticket: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const msg = [
    `📩 *SUPPORT TICKET*`,
    ``,
    `Name: ${ticket.name}`,
    `Email: ${ticket.email}`,
    `Subject: ${ticket.subject}`,
    `Message: ${ticket.message.substring(0, 200)}${ticket.message.length > 200 ? '...' : ''}`,
    ``,
    `🔗 https://bangparjo.com/admin/dashboard/support`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

// ── CJ Dropshipping Event Notifications ──────────────────────────────────────

/**
 * Notify admin when CJ order status changes
 */
export async function notifyCJOrderUpdate(params: {
  orderNumber?: string;
  cjOrderId?: string;
  orderStatus: string;
}) {
  const statusLabels: Record<string, string> = {
    SHIPPED: '📦 Shipped',
    CANCELLED: '❌ Cancelled',
    COMPLETED: '✅ Completed',
    PROCESSING: '🔧 Processing',
  };

  const msg = [
    `🔔 *CJ Order Update*`,
    ``,
    `Store Order: #${params.orderNumber || '-'}`,
    `CJ Order ID: ${params.cjOrderId || '-'}`,
    `Status: ${statusLabels[params.orderStatus] || params.orderStatus}`,
    ``,
    `🔗 https://bangparjo.com/admin/orders`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

/**
 * Notify admin when tracking is updated
 */
export async function notifyTrackingUpdate(params: {
  orderId?: string;
  trackingNumber?: string;
  logisticName?: string;
}) {
  const msg = [
    `📬 *Tracking Updated*`,
    ``,
    `CJ Order: #${params.orderId || '-'}`,
    `Courier: ${params.logisticName || '-'}`,
    `Tracking: ${params.trackingNumber || '-'}`,
    ``,
    `Track here: https://www.17track.net`,
    `🔗 https://bangparjo.com/admin/orders`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

/**
 * Notify admin when stock is low
 */
export async function notifyLowStock(variants: { sku: string; name: string; stock: number }[]) {
  const items = variants.map(v => `• ${v.name || v.sku}: ${v.stock} left`).join('\n');
  const msg = [
    `⚠️ *LOW STOCK ALERT*`,
    ``,
    `The following products are running low:`,
    ``,
    items,
    ``,
    `🔗 https://bangparjo.com/admin/myproducts`,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

/**
 * Notify admin when CJ webhook registration succeeds or fails
 */
export async function notifyWebhookRegister(result: { success: boolean; message: string }) {
  const icon = result.success ? '✅' : '❌';
  const msg = [
    `${icon} *CJ Webhook Registration*`,
    ``,
    result.message,
  ].join('\n');

  return sendWA({ target: ADMIN_WA, message: msg });
}

// ── Customer Notifications (via OpenClaw) ────────────────────────────────────

/**
 * Send custom WhatsApp message to any number
 */
export async function sendCustomWA(target: string, message: string) {
  return sendWA({ target, message });
}

// ── Default Export ───────────────────────────────────────────────────────────

export default {
  notifyOrderCreated,
  notifyPaymentReceived,
  notifyShipped,
  notifyContactAdmin,
  notifyCJOrderUpdate,
  notifyTrackingUpdate,
  notifyLowStock,
  notifyWebhookRegister,
  sendCustomWA,
};
