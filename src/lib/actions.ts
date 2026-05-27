'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import crypto from 'crypto';
import { notifyOrderCreated, sendCustomWA } from '@/lib/openclaw';
import { processFulfillment } from '@/lib/fulfillment';
import { getExchangeRateIDR } from '@/lib/currency';
import { sendCheckoutEmail } from '@/lib/mail';
import { normalizePhone } from '@/lib/phone';
import { getShippingFee, getShippingFeeBySku } from '@/lib/cj-api';
import { calculateShippingFee, DEFAULT_SETTINGS, StoreSettings } from '@/lib/pricing';
import { getCachedStoreSettings } from '@/lib/server-settings';

const WEBHOOK_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
// @ts-ignore
import Midtrans from 'midtrans-client';

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
});


export async function addToCartAction(productId: string, variantId: string, quantity: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Logic to add to cart goes here (assuming they have a Cart model or use Redis)
    // Example:
    // await prisma.cartItem.upsert({ ... })

    revalidatePath('/cart'); // Revalidate the cart page so changes reflect instantly
    return { success: true, message: 'Added to cart successfully' };
  } catch (error) {
    console.error('Server Action Error (addToCart):', error);
    return { success: false, error: 'Failed to add to cart' };
  }
}

export async function updateProfileSettingsAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Profile updated' };
  } catch (error) {
    console.error('Server Action Error (updateProfile):', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

// --- Cart Actions ---
export async function syncCartAction(items: any[]) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) return { success: false, error: 'User not found' };

    await prisma.cartItem.deleteMany({ where: { userId: user.id } });

    if (items && items.length > 0) {
      await prisma.cartItem.createMany({
        data: items.map((item: any) => ({
          userId: user.id,
          pid: item.pid,
          vid: item.selectedVid || null,
          sku: item.selectedSku || null,
          variantName: item.selectedVariantName || null,
          productName: item.productName || '',
          productNameEn: item.productNameEn || '',
          productImage: item.selectedVariantImage || item.productImage || '',
          bigImage: item.selectedVariantImage || item.bigImage || '',
          sellPrice: parseFloat(item.sellPrice) || 0,
          quantity: item.quantity || 1,
        })),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error('syncCartAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCartAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cartItems: true }
    });
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, data: user.cartItems };
  } catch (error: any) {
    console.error('getCartAction error:', error);
    return { success: false, error: error.message };
  }
}

// --- Wishlist Actions ---
export async function syncWishlistAction(items: any[]) {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) return { success: false, error: 'User not found' };

    await prisma.wishlistItem.deleteMany({ where: { userId: user.id } });

    if (items && items.length > 0) {
      await prisma.wishlistItem.createMany({
        data: items.map((item: any) => ({
          userId: user.id,
          pid: item.pid,
          productName: item.productName || '',
          productNameEn: item.productNameEn || '',
          productImage: item.productImage || '',
          sellPrice: parseFloat(item.sellPrice) || 0,
          categoryName: item.categoryName || '',
        })),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error('syncWishlistAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function getWishlistAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: 'Unauthorized' };
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wishlistItems: true }
    });
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, data: user.wishlistItems };
  } catch (error: any) {
    console.error('getWishlistAction error:', error);
    return { success: false, error: error.message };
  }
}

// --- Order Actions ---
async function triggerOpenClawWebhook(order: any) {
  if (!WEBHOOK_SECRET) {
    console.warn('[Orders] OPENCLAW_WEBHOOK_SECRET not configured, skipping webhook trigger');
    return;
  }

  try {
    const checkoutUrl = `${BASE_URL}/checkout/${order.orderNum}?id=${order.checkoutToken}`;
    
    let shippingCountryCode = '';
    try {
      const orderData = typeof order.orderData === 'string'
        ? JSON.parse(order.orderData)
        : order.orderData;
      shippingCountryCode = orderData?.shippingCountryCode || '';
    } catch (e) { /* ignore */ }

    const payload = {
      event: 'order.created',
      data: {
        orderNum: order.orderNum,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        shippingCountryCode,
        checkoutUrl,
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      }
    };

    fetch(`${BASE_URL}/api/webhooks/openclaw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'order-created',
        data: payload.data,
      }),
    }).then(res => {
      if (!res.ok) console.warn('[Orders] OpenClaw webhook returned', res.status);
    }).catch(err => console.warn('[Orders] OpenClaw webhook error:', err.message));

    console.log('[Orders] OpenClaw webhook triggered for order', order.orderNum);
  } catch (err: any) {
    console.warn('[Orders] Failed to trigger OpenClaw webhook:', err.message);
  }
}

export async function createOrderAction(data: any) {
  try {
    const { orderNum, customerEmail, customerName, customerPhone, totalAmount, costAmount, orderData, couponCode } = data;
    const status = 'UNPAID';
    if (!orderNum) return { success: false, message: 'orderNum is required' };

    const checkoutToken = crypto.randomBytes(32).toString('hex');

    if (couponCode) {
      try {
        await prisma.coupon.update({
          where: { code: couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      } catch (couponErr) {}
    }

    const order = await prisma.order.upsert({
      where: { orderNum },
      update: {
        customerEmail,
        customerName,
        customerPhone,
        totalAmount,
        costAmount,
        status: status,
        orderData: typeof orderData === 'string' ? JSON.parse(orderData) : orderData,
        checkoutToken,
      },
      create: {
        orderNum,
        checkoutToken,
        customerEmail,
        customerName,
        customerPhone,
        totalAmount,
        costAmount,
        status: status,
        orderData: typeof orderData === 'string' ? JSON.parse(orderData) : orderData,
      },
    });

    notifyOrderCreated({
      orderNum: order.orderNum,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: order.status,
    }).catch(err => console.warn('[OpenClaw] Notif order gagal:', err));

    triggerOpenClawWebhook(order);

    return { success: true, order };
  } catch (error: any) {
    console.error('Server Action Error (createOrder):', error);
    return { success: false, error: error.message };
  }
}

export async function getOrderAction(orderNum: string, token: string) {
  try {
    if (!token) return { success: false, error: 'Security token is required' };

    const order = await prisma.order.findUnique({ 
      where: { orderNum },
      include: { items: { include: { variant: true } } }
    });
    
    if (!order) return { success: false, error: 'Order not found' };
    
    if (order.checkoutToken !== token) {
      return { success: false, error: 'Invalid security token' };
    }

    return { success: true, data: order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendOrderLinkAction(data: { orderNum: string, token: string, checkoutUrl: string }) {
  try {
    const { orderNum, token, checkoutUrl } = data;

    if (!orderNum || !token) {
      return { success: false, error: 'Missing parameters' };
    }

    let order = await prisma.order.findUnique({ where: { orderNum } });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.checkoutToken !== token) {
      return { success: false, error: 'Invalid token' };
    }

    if ((order as any).emailSent) {
      return { success: true, message: 'Email already sent previously' };
    }

    let shippingCountryCode = '';
    try {
      const orderData = typeof order.orderData === 'string'
        ? JSON.parse(order.orderData)
        : order.orderData;
      shippingCountryCode = orderData?.shippingCountryCode || '';
    } catch (e) {
      // ignore parse errors
    }

    let emailSent = false;
    if (order.customerEmail) {
      const mailRes = await sendCheckoutEmail(order.customerEmail, orderNum, checkoutUrl);
      emailSent = mailRes.success;
    }

    let waSent = false;
    const customerPhone = order.customerPhone || '';
    if (customerPhone) {
      const cleanPhone = normalizePhone(customerPhone, shippingCountryCode);

      if (cleanPhone.length >= 10) {
        const waMessage = [
          `🛒 *BangParjo Shop — Payment Confirmation*`,
          ``,
          `Hi *${order.customerName || 'there'}*! 👋`,
          ``,
          `Thank you for ordering at BangParjo Shop.`,
          `Your order *#${orderNum}* has been received.`,
          `Please *complete your payment* to proceed!`,
          ``,
          `🔗 *Payment Link:*`,
          `${checkoutUrl}`,
          ``,
          `⏳ *Deadline: 24 hours*`,
          `Once paid, we'll process your order right away.`,
          ``,
          `If you have any questions, just reply to this message 😊`,
          ``,
          `— BangParjo Shop`,
        ].join('\n');

        const waRes = await sendCustomWA(cleanPhone, waMessage);
        waSent = waRes.success;
        if (!waSent) {
          console.warn('[SendLink] WA failed to send to', cleanPhone, waRes.error);
        }
      }
    }

    const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980';
    const adminMsg = [
      `🛒 *NEW ORDER — Link Sent*`,
      ``,
      `Order: #${orderNum}`,
      `Name: ${order.customerName || '-'}`,
      `Email: ${order.customerEmail || '-'}`,
      `Phone: ${customerPhone || '-'}`,
      `Country: ${shippingCountryCode || '-'}`,
      `Email sent: ${emailSent ? '✅' : '❌'}`,
      `WA sent: ${waSent ? '✅' : '❌'}`,
      ``,
      `🔗 ${checkoutUrl}`,
    ].join('\n');
    sendCustomWA(adminPhone, adminMsg).catch(() => {});

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Order" SET "emailSent" = true, "waSent" = $1 WHERE "orderNum" = $2`,
        waSent,
        orderNum
      );
    } catch (dbErr) {
      console.error('Failed to update sent flags:', dbErr);
    }

    return {
      success: true,
      message: 'Notifications sent',
      emailSent,
      waSent,
    };
  } catch (error: any) {
    console.error('[Send Link Error]:', error);
    return { success: false, error: error.message };
  }
}

// --- Coupon Actions ---
export async function getActiveCouponsAction() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        products: true
      }
    });

    const serialized = coupons.map(c => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      minPurchase: c.minPurchase,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      products: c.products.map(p => ({
        id: p.id,
        productCjId: p.productCjId
      }))
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error('[Get Active Coupons Error]:', error);
    return { success: false, error: error.message };
  }
}

export async function validateCouponAction(data: { code: string; subtotal?: number; productPid?: string }) {
  try {
    const { code, subtotal, productPid } = data;

    if (!code) return { success: false, error: 'Coupon code is required' };

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { products: true },
    });

    if (!coupon) return { success: false, error: 'Invalid coupon code' };
    if (!coupon.isActive) return { success: false, error: 'This coupon is no longer active' };
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return { success: false, error: 'This coupon has expired' };
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { success: false, error: 'This coupon has reached its usage limit' };

    if (productPid) {
      const isAssigned = coupon.products.some(p => p.productCjId === productPid);
      if (!isAssigned) return { success: false, error: 'This coupon is not valid for this product' };
    } else if (coupon.products.length > 0) {
      return { success: false, error: 'This coupon is only valid for specific products' };
    }

    const orderSubtotal = subtotal || 0;
    if (coupon.minPurchase !== null && orderSubtotal < coupon.minPurchase) {
      return { success: false, error: `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required`, minPurchase: coupon.minPurchase };
    }

    let discountAmount = 0;
    let freeShipping = false;

    switch (coupon.type) {
      case 'PERCENTAGE': discountAmount = (orderSubtotal * coupon.value) / 100; break;
      case 'FIXED': discountAmount = Math.min(coupon.value, orderSubtotal); break;
      case 'FREE_SHIPPING': freeShipping = true; discountAmount = 0; break;
      default: discountAmount = (orderSubtotal * coupon.value) / 100;
    }

    return {
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        freeShipping,
        description: coupon.description,
      },
    };
  } catch (error: any) {
    console.error('[Coupon Validate Error]:', error);
    return { success: false, error: error.message };
  }
}

// --- Payment Actions ---
export async function getMidtransTokenAction(data: { orderId: string; customerDetails: any }) {
  try {
    const { orderId, customerDetails } = data;
    
    const order = await prisma.order.findUnique({
      where: { orderNum: orderId }
    });

    if (!order || !order.totalAmount) {
      return { success: false, error: 'Invalid order' };
    }

    const exchangeRate = await getExchangeRateIDR();
    const idrAmount = Math.round(order.totalAmount * exchangeRate);

    const midtransOrderId = `${orderId}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: idrAmount,
      },
      customer_details: {
        first_name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      credit_card: {
        secure: true
      },
      usage_limit: 1
    };

    const transaction = await snap.createTransaction(parameter);
    return { success: true, token: transaction.token };
  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return { success: false, error: error.message };
  }
}

export async function capturePayPalOrderAction(data: { orderId: string; paypalData: any }) {
  try {
    const { orderId, paypalData } = data;

    if (!orderId || !paypalData || !paypalData.orderID) {
      return { success: false, message: 'orderId and paypalData.orderID are required' };
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    const secret = process.env.PAYPAL_CLIENT_SECRET || '';

    if (!clientId || !secret) {
      console.warn('[PayPal] Missing PAYPAL_CLIENT_SECRET. Failing securely.');
      return { success: false, error: 'Payment gateway configuration error' };
    }

    const isLive = process.env.NODE_ENV === 'production' && !clientId.includes('sandbox');
    const baseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const authStr = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalData.orderID}`, {
      headers: {
        'Authorization': `Basic ${authStr}`,
      },
    });

    const orderDetails = await response.json();

    if (orderDetails.status !== 'COMPLETED') {
      console.warn(`[PayPal] Order ${paypalData.orderID} is not COMPLETED. Current status: ${orderDetails.status}`);
      return { success: false, error: 'Payment not completed' };
    }

    const dbOrder = await prisma.order.findUnique({
      where: { orderNum: orderId }
    });

    if (!dbOrder || !dbOrder.totalAmount) {
      return { success: false, error: 'Order not found in database' };
    }

    const paypalAmount = parseFloat(orderDetails.purchase_units[0].amount.value);
    
    // Allow max $0.05 variation for floating point rounding discrepancies
    if (Math.abs(paypalAmount - dbOrder.totalAmount) > 0.05) {
      console.warn(`[PayPal Security] Amount mismatch! Order ${orderId} expected $${dbOrder.totalAmount}, but PayPal paid $${paypalAmount}`);
      return { success: false, error: 'Payment amount mismatch. Possible tampering detected.' };
    }

    console.log(`[PayPal] Payment verified securely for ${orderId}. Updating status to PAID...`);

    await prisma.order.update({
      where: { orderNum: orderId },
      data: { status: 'PAID', paymentStatus: 'COMPLETED' }
    });

    const result = await processFulfillment(orderId);
    return result;
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return { success: false, error: error.message };
  }
}

// --- Phase 3 Actions ---

export async function getShippingRatesAction(data: { products?: any[], country?: string, subtotal?: number, sku?: string, vid?: string, quantity?: number, weight?: number }) {
  try {
    const { products: productsParam, country = 'ID', subtotal = 0, sku, vid, quantity = 1, weight = 0 } = data;
    const settings = await getCachedStoreSettings();

    const skuList = productsParam 
      ? productsParam.map(p => ({ 
          sku: p.sku || p.vid || '', 
          quantity: p.quantity || 1, 
          weight: p.weight || 200, 
          price: subtotal > 0 ? subtotal / productsParam.length : 10 
        })).filter(p => p.sku)
      : (sku ? [{ sku, quantity, weight: weight || 200, price: subtotal / quantity || 10 }] : []);

    if (skuList.length > 0) {
      const skuRes = await getShippingFeeBySku({
        products: skuList,
        endCountryCode: country,
      });

      if (skuRes.success && skuRes.data && skuRes.data.length > 0) {
        const finalRates = skuRes.data.map((rate: any) => {
          const finalPrice = calculateShippingFee(rate.logisticPrice, subtotal, settings);
          return {
            ...rate,
            logisticPrice: finalPrice,
            estimatedDays: rate.logisticAging ? `${rate.logisticAging} days` : '',
            formattedPrice: finalPrice === 0 ? 'FREE' : `USD ${finalPrice.toFixed(2)}`
          };
        });
        return { success: true, data: finalRates };
      }
    }

    let products: Array<{ vid: string; quantity: number }> = [];

    if (productsParam) {
      products = productsParam;
    } else if (vid) {
      products = [{ vid, quantity }];
    }

    if (products.length === 0) {
      return { success: false, error: 'Missing products or sku' };
    }

    const res = await getShippingFee({ products, endCountryCode: country });

    if (!res.success || !res.data || res.data.length === 0) {
      return { success: false, error: 'Failed to calculate shipping rates from CJ.' };
    }

    const finalRates = res.data.map((rate: any) => {
      const finalPrice = calculateShippingFee(rate.logisticPrice, subtotal, settings);
      return {
        ...rate,
        logisticPrice: finalPrice,
        estimatedDays: rate.logisticAging ? `${rate.logisticAging} days` : '',
        formattedPrice: finalPrice === 0 ? 'FREE' : `USD ${finalPrice.toFixed(2)}`
      };
    });

    return { success: true, data: finalRates };
  } catch (error: any) {
    console.error('getShippingRatesAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrencyRateAction() {
  try {
    const rate = await getExchangeRateIDR();
    return { success: true, rate };
  } catch (error: any) {
    console.error('getCurrencyRateAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function getStoreSettingsAction() {
  try {
    const dbSettings = await prisma.storeSetting.findMany();
    const dbTiers = await prisma.marginTier.findMany({
      orderBy: { min: 'asc' }
    });

    const settings: any = { ...DEFAULT_SETTINGS };
    dbSettings.forEach(s => {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch {
        settings[s.key] = s.value;
      }
    });

    if (dbSettings.length > 0) {
      settings.marginTiers = dbTiers.map(t => ({ min: t.min, max: t.max, pct: t.pct }));
    } else if (dbTiers.length > 0) {
      settings.marginTiers = dbTiers.map(t => ({ min: t.min, max: t.max, pct: t.pct }));
    }

    return { success: true, data: settings };
  } catch (error: any) {
    console.error('getStoreSettingsAction error:', error);
    return { success: false, error: error.message, data: DEFAULT_SETTINGS };
  }
}

export async function updateStoreSettingsAction(data: StoreSettings) {
  try {
    const session = await auth();
    // Assuming you have an admin check here, simplified for now:
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const keys = Object.keys(data).filter(k => k !== 'marginTiers');
    for (const key of keys) {
      const val = (data as any)[key];
      await prisma.storeSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(val) },
        create: { key, value: JSON.stringify(val) },
      });
    }

    if (data.marginTiers) {
      await prisma.marginTier.deleteMany();
      await prisma.marginTier.createMany({
        data: data.marginTiers.map(t => ({ min: t.min, max: t.max, pct: t.pct }))
      });
    }

    try {
      const { invalidateCache } = await import('@/lib/redis');
      await invalidateCache('store:settings');
    } catch (e) {
      console.warn('[Settings] Failed to invalidate Redis cache:', e);
    }

    return { success: true };
  } catch (error: any) {
    console.error('updateStoreSettingsAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductCouponsAction(productId: string) {
  try {
    if (!productId) return { success: false, error: 'productId is required' };

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        products: { some: { productCjId: productId } },
      },
      select: {
        id: true, code: true, type: true, value: true,
        minPurchase: true, maxUses: true, usedCount: true, expiresAt: true,
      },
    });

    const validCoupons = coupons.filter((c) => {
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
      if (c.maxUses && c.usedCount >= c.maxUses) return false;
      return true;
    });

    return { success: true, data: validCoupons };
  } catch (error: any) {
    console.error('getProductCouponsAction error:', error);
    return { success: false, error: error.message };
  }
}
