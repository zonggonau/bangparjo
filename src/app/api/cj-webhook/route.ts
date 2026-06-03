import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWhatsAppOrderNotification } from '@/lib/social-poster';
import { revalidateTag } from 'next/cache';
import { importProductVariantsAction } from '@/lib/actions-catalog';
import { getDBStoreSettings, applyMarginToPrice } from '@/lib/pricing';

/**
 * CJ Dropshipping Webhook Receiver (Enhanced)
 * Handles:
 * - ORDER: Status changes → WhatsApp notification to customer
 * - LOGISTIC: Tracking number → WhatsApp tracking notification
 * - STOCK: Inventory sync
 *
 * Register this URL in CJ dashboard:
 *   https://yourstore.com/api/cj-webhook
 */

/**
 * GET handler — Required for CJ webhook URL validation.
 * CJ's webhook/set API performs a URL reachability check before accepting
 * the callback URL. This handler returns 200 OK to pass validation.
 */
export async function GET() {
  return NextResponse.json({ success: true, message: 'Webhook endpoint is active' });
}

export async function POST(req: Request) {
  let body: any = {};
  let type = '';
  let messageType = '';
  let params: any = {};
  let messageId = '';

  try {
    body = await req.json();
    type = body?.type || '';
    messageType = body?.messageType || '';
    params = body?.params || {};
    messageId = body?.messageId || '';
  } catch {
    // CJ sends a validation POST to verify the callback URL.
    // Return 200 OK immediately to pass URL validation.
    return NextResponse.json({ success: true, message: 'Webhook endpoint is active' });
  }

  // ── Respond 200 OK immediately (CJ requires response within 3 seconds) ──
  // Process webhook logic asynchronously after sending response.
  const response = NextResponse.json({ success: true, messageId });

  // Fire-and-forget: process webhook in background
  processWebhook(type, messageType, params, body, messageId).catch((err) => {
    console.error('❌ [CJ WEBHOOK BACKGROUND ERROR]:', err);
  });

  return response;
}

/**
 * Process webhook event asynchronously.
 * This runs after the 200 OK response is sent to CJ,
 * so any database delays or errors won't affect URL validation.
 */
async function processWebhook(
  type: string,
  messageType: string,
  params: any,
  body: any,
  messageId: string
) {
  try {
    // 1. Log webhook (fire-and-forget, don't block on failure)
    try {
      await prisma.webhookLog.create({
        data: { eventType: type, payload: body },
      });
    } catch (logErr) {
      console.warn('[CJ WEBHOOK] Logging failed (table may not exist yet):', logErr);
    }

    console.log(`🔔 [CJ WEBHOOK]: ${type}`, params);

    // 2. Dispatch
    switch (type) {
      case 'ORDER':
        await handleOrderUpdate(params);
        break;
      case 'LOGISTIC':
        await handleLogisticUpdate(params);
        break;
      case 'STOCK':
        await handleStockUpdate(params);
        break;
      case 'PRODUCT':
      case 'VARIANT':
        await handleProductUpdate(type, messageType, params);
        break;
      default:
        console.warn(`[CJ WEBHOOK]: Unhandled type: ${type}`);
    }
  } catch (error: any) {
    console.error('❌ [CJ WEBHOOK PROCESSING ERROR]:', error);
    try {
      await prisma.webhookLog.create({
        data: { eventType: type, payload: body, error: error.message, processed: false },
      });
    } catch {}
  }
}

async function handleOrderUpdate(params: any) {
  const { orderNumber, cjOrderId, orderStatus } = params;
  if (!orderNumber) return;

  const internalStatus =
    orderStatus === 'SHIPPED' ? 'SHIPPED' :
    orderStatus === 'CANCELLED' ? 'CANCELLED' :
    orderStatus === 'COMPLETED' ? 'DELIVERED' : 'PROCESSING';

  const updatedOrder = await prisma.order.update({
    where: { orderNum: orderNumber },
    data: { cjOrderId, status: internalStatus, cjResponse: params },
  });

  // WhatsApp notification for key status changes
  if ((internalStatus === 'SHIPPED' || internalStatus === 'PROCESSING') && updatedOrder.customerPhone) {
    const phone = updatedOrder.customerPhone.startsWith('+') 
      ? updatedOrder.customerPhone 
      : `+${updatedOrder.customerPhone}`;
    
    await sendWhatsAppOrderNotification({
      to: phone,
      customerName: updatedOrder.customerName || 'Customer',
      orderId: orderNumber,
      totalAmount: Number(updatedOrder.totalAmount) || 0,
      type: internalStatus === 'SHIPPED' ? 'order_shipped' : 'order_placed',
    }).catch(e => console.warn('[WA Notify Error]:', e.message));
  }
}

async function handleLogisticUpdate(params: any) {
  const { orderId, trackingNumber, logisticName } = params;
  if (!orderId) return;

  const updatedOrder = await prisma.order.update({
    where: { cjOrderId: orderId },
    data: { trackingNumber, status: 'SHIPPED', cjResponse: params },
  });

  // Send tracking WhatsApp if customer has phone
  if (updatedOrder.customerPhone && trackingNumber) {
    const phone = updatedOrder.customerPhone.startsWith('+')
      ? updatedOrder.customerPhone
      : `+${updatedOrder.customerPhone}`;

    await sendWhatsAppOrderNotification({
      to: phone,
      customerName: updatedOrder.customerName || 'Customer',
      orderId: updatedOrder.orderNum,
      totalAmount: Number(updatedOrder.totalAmount) || 0,
      trackingNumber,
      type: 'order_shipped',
    }).catch(e => console.warn('[WA Tracking Error]:', e.message));
  }
}

async function handleStockUpdate(params: any) {
  // Payload struktur:
  //   params = { [vid]: [ { pid, vid, areaEn, storageNum, ... }, ... ], ... }
  //
  // Setiap key adalah vid, setiap value adalah array warehouse entries.
  // pid ada di DALAM setiap warehouse entry, bukan di level params.

  // Kumpulkan: total stok per vid, dan pid unik yang perlu diproses
  const stockByVid: Record<string, number> = {};
  const pidsFromPayload = new Set<string>();

  for (const vid in params) {
    const warehouseList = params[vid];
    if (!Array.isArray(warehouseList) || warehouseList.length === 0) continue;

    // Ambil pid dari dalam entri warehouse
    const pid = warehouseList[0]?.pid;
    if (pid) pidsFromPayload.add(pid);

    // Total stok = jumlah storageNum dari semua gudang untuk vid ini
    const totalStock = warehouseList.reduce((sum: number, w: any) => sum + (Number(w.storageNum) || 0), 0);
    stockByVid[vid] = totalStock;
  }

  console.log(`[CJ Webhook STOCK] Processing ${Object.keys(stockByVid).length} variants, PIDs from payload: ${[...pidsFromPayload].join(', ')}`);

  // Update stok di DB untuk variant yang sudah ada
  for (const [vid, totalStock] of Object.entries(stockByVid)) {
    await prisma.variant.updateMany({
      where: { cjId: vid },
      data: { inventory: totalStock },
    });
  }

  // Untuk setiap pid dari payload:
  //   - Jika produk belum ada di DB → import produk baru + semua variannya
  //   - Jika sudah ada → reimport semua varian (supaya stok terbaru masuk)
  for (const pid of pidsFromPayload) {
    try {
      const existingProduct = await prisma.product.findUnique({ where: { cjId: pid } });

      if (!existingProduct) {
        // Produk baru! Import seluruh detail + semua varian dari CJ
        console.log(`[CJ Webhook STOCK] New product detected: ${pid}. Importing...`);
        importProductVariantsAction(pid).catch(err => {
          console.warn(`[CJ Webhook STOCK] Import new product ${pid} failed:`, err);
        });
      } else {
        // Produk sudah ada, reimport semua varian untuk update stok terbaru
        importProductVariantsAction(pid).catch(err => {
          console.warn(`[CJ Webhook STOCK] Reimport variants for ${pid} failed:`, err);
        });
      }
    } catch (e) {
      console.warn(`[CJ Webhook STOCK] DB check failed for pid ${pid}:`, e);
    }
  }

  console.log(`[CJ Webhook STOCK] Done. Updated ${Object.keys(stockByVid).length} variant stocks, queued import for ${pidsFromPayload.size} products.`);
}

async function handleProductUpdate(type: string, messageType: string | undefined, params: any) {
  // Payload VARIANT webhook:
  //   params = { pid, vid, variantSku, variantName, variantImage, variantStatus, variantSellPrice, variantWeight, ... }
  //
  // Payload PRODUCT webhook:
  //   params = { pid, productNameEn, productImage, productStatus, ... }

  const { pid, vid, status, sellPrice } = params || {};

  console.log(`[CJ Webhook] ${type} update messageType=${messageType} pid=${pid} vid=${vid}`);

  // ── Handle DELETE ──────────────────────────────────────────────────────
  if (messageType === 'DELETE') {
    if (type === 'PRODUCT' && pid) {
      await prisma.product.updateMany({
        where: { cjId: pid },
        data: { status: 'INACTIVE' },
      });
      console.log(`[CJ Webhook] Product ${pid} set to INACTIVE (DELETED)`);
    } else if (type === 'VARIANT' && vid) {
      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { inventory: 0 },
      });
      console.log(`[CJ Webhook] Variant ${vid} stock set to 0 (DELETED)`);
    }
    return;
  }

  // ── Handle INSERT/UPDATE ───────────────────────────────────────────────
  if (!pid) {
    console.warn('[CJ Webhook] No pid in payload, skipping.');
    return;
  }

  // Cek apakah produk sudah ada di DB
  const existingProduct = await prisma.product.findUnique({ where: { cjId: pid } });

  if (!existingProduct) {
    // ── PRODUK BARU: Import seluruh produk + semua varian dari CJ API ──
    console.log(`[CJ Webhook ${type}] New product detected: ${pid}. Importing full product + variants...`);
    importProductVariantsAction(pid).catch(err => {
      console.warn(`[CJ Webhook ${type}] Import new product ${pid} failed:`, err);
    });
    return;
  }

  // ── Produk sudah ada: Update data dari payload ─────────────────────────
  if (type === 'PRODUCT') {
    const productUpdateData: any = {};
    if (params.productNameEn) productUpdateData.name = params.productNameEn;
    if (params.productDescription) productUpdateData.description = params.productDescription;
    if (params.productStatus !== undefined) {
      productUpdateData.status = params.productStatus === 3 ? 'ACTIVE' : 'INACTIVE';
    } else if (status !== undefined) {
      productUpdateData.status = status === 0 ? 'INACTIVE' : 'ACTIVE';
    }
    if (params.productImage) productUpdateData.images = { set: [params.productImage] };

    if (Object.keys(productUpdateData).length > 0) {
      await prisma.product.updateMany({ where: { cjId: pid }, data: productUpdateData });
      console.log(`[CJ Webhook PRODUCT] Updated product ${pid}:`, productUpdateData);
    }

    // Reimport semua varian setelah update produk
    importProductVariantsAction(pid).catch(err => {
      console.warn(`[CJ Webhook PRODUCT] Reimport variants for ${pid} failed:`, err);
    });

  } else if (type === 'VARIANT' && vid) {
    // ── Update data variant langsung dari payload webhook ─────────────────
    // variantStatus: 1=ACTIVE (on sale), 0=INACTIVE (delisted)
    const baseCost = params.variantSellPrice ? parseFloat(params.variantSellPrice) :
                     sellPrice !== undefined ? parseFloat(sellPrice) : 0;
    const weight = Number(params.variantWeight || 0);

    // Inventory: jika variantStatus=1 artinya ACTIVE, inventory dari stok existing
    // Jika variantStatus=0, set inventory ke 0
    let inventory: number | undefined = undefined;
    if (params.variantStatus !== undefined) {
      inventory = params.variantStatus === 0 ? 0 : undefined; // 0=non-aktif → stok 0
    }

    const existingVariant = await prisma.variant.findUnique({ where: { cjId: vid } });

    if (existingVariant) {
      // Update variant yang sudah ada
      const vUpdateData: any = {};
      if (params.variantSku) vUpdateData.sku = params.variantSku;
      if (baseCost > 0) {
        // Hitung margin saat webhook update agar sellingPrice di DB tetap up-to-date
        const settings = await getDBStoreSettings();
        vUpdateData.baseCost = baseCost;
        vUpdateData.sellingPrice = applyMarginToPrice(baseCost, settings);
      }
      if (weight > 0) vUpdateData.weight = weight;
      if (inventory !== undefined) vUpdateData.inventory = inventory;
      if (params.variantImage) vUpdateData.image = params.variantImage;
      if (params.variantKey) vUpdateData.color = params.variantKey;
      if (params.variantName || params.variantNameEn) vUpdateData.size = params.variantName || params.variantNameEn;

      if (Object.keys(vUpdateData).length > 0) {
        await prisma.variant.update({ where: { id: existingVariant.id }, data: vUpdateData });
        console.log(`[CJ Webhook VARIANT] Updated variant ${vid}:`, vUpdateData);
      }
    } else {
      // Variant baru — reimport semua varian produk ini dari CJ untuk dapat data lengkap
      console.log(`[CJ Webhook VARIANT] New variant ${vid} detected for product ${pid}. Reimporting all variants...`);
      importProductVariantsAction(pid).catch(err => {
        console.warn(`[CJ Webhook VARIANT] Reimport all variants for ${pid} failed:`, err);
      });
    }
  }

  // Cache di-skip — data langsung dari database
}
