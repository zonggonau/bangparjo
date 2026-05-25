import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTrackingInfo, getProductDetails } from '@/lib/cj-api';
import { sendCustomWA } from '@/lib/openclaw';
import { normalizePhone } from '@/lib/phone';

// ── Tool definitions for AI ──────────────────────────────────────────────────
interface ToolCall {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
  parameters: Record<string, any>;
}

const TOOLS: ToolCall[] = [
  {
    name: 'get_order_status',
    description: 'Get the status of an order by order number',
    parameters: { orderNum: 'string (required) - Order number like BP-XXXXX' },
    execute: async (orderNum: string) => {
      const order = await prisma.order.findUnique({ where: { orderNum } });
      if (!order) return { found: false, message: `Order #${orderNum} not found` };
      return {
        found: true,
        orderNum: order.orderNum,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: order.status,
        totalAmount: order.totalAmount,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
      };
    },
  },
  {
    name: 'get_tracking_info',
    description: 'Get real-time tracking information for an order',
    parameters: { orderNum: 'string (required) - Order number or tracking ID' },
    execute: async (orderNum: string) => {
      // Try by tracking number first
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNum },
            { trackingNumber: orderNum },
          ],
        },
      });
      if (!order) return { found: false, message: `No order or tracking found for: ${orderNum}` };
      // Try CJ tracking API
      try {
        const res = await getTrackingInfo(order.orderNum);
        if (res.success) return { found: true, ...res.data };
      } catch (e) { /* ignore */ }
      // Fallback to local data
      // Get logistic name from orderData if available
      let logisticName = 'Unknown';
      try {
        const orderData = typeof order.orderData === 'string'
          ? JSON.parse(order.orderData)
          : order.orderData;
        logisticName = orderData?.logisticName || 'Unknown';
      } catch (e) { /* ignore */ }
      return {
        found: true,
        orderNum: order.orderNum,
        status: order.status,
        trackingNumber: order.trackingNumber || 'Not yet shipped',
        logisticName,
      };
    },
  },
  {
    name: 'send_wa_notification',
    description: 'Send a WhatsApp message to a customer via OpenClaw',
    parameters: {
      phone: 'string (required) - Phone number with country code, e.g. 62812xxxx',
      message: 'string (required) - The message content to send',
    },
    execute: async (phone: string, message: string) => {
      const cleanPhone = normalizePhone(phone);
      if (cleanPhone.length < 10) return { success: false, error: 'Invalid phone number' };
      const result = await sendCustomWA(cleanPhone, message);
      return result;
    },
  },
  {
    name: 'get_product_details',
    description: 'Get detailed information about a product by its CJ PID',
    parameters: { pid: 'string (required) - CJ Product ID like 2605180158461625300' },
    execute: async (pid: string) => {
      // Try local DB first
      const local = await prisma.product.findUnique({
        where: { cjId: pid },
        include: { variants: { take: 5 }, category: true },
      });
      if (local) {
        return {
          source: 'local',
          name: local.name,
          price: local.variants?.[0]?.sellingPrice || 0,
          images: local.images?.slice(0, 3) || [],
          category: local.category?.name || 'Uncategorized',
          variantCount: local.variants?.length || 0,
          totalStock: local.totalStock,
        };
      }
      // Fallback to CJ API
      const cjRes = await getProductDetails(pid);
      if (cjRes.success && cjRes.data) {
        const p = cjRes.data;
        return {
          source: 'cj-api',
          name: p.productNameEn || p.productName,
          price: p.sellPrice,
          images: [p.bigImage || p.productImage],
          category: p.categoryName || 'Imported',
          variantCount: p.variants?.length || 0,
        };
      }
      return { found: false, message: 'Product not found' };
    },
  },
  {
    name: 'send_payment_link',
    description: 'Resend payment link to a customer via WhatsApp for an unpaid order',
    parameters: { orderNum: 'string (required) - Order number like BP-XXXXX' },
    execute: async (orderNum: string) => {
      const order = await prisma.order.findUnique({ where: { orderNum } });
      if (!order) return { success: false, error: `Order #${orderNum} not found` };
      if (order.status !== 'PENDING') return { success: false, error: `Order #${orderNum} is already ${order.status}, no need for payment` };
      
      const customerPhone = order.customerPhone || '';
      if (!customerPhone) return { success: false, error: 'Customer phone not available' };

      let shippingCountryCode = '';
      try {
        const orderData = typeof order.orderData === 'string'
          ? JSON.parse(order.orderData)
          : order.orderData;
        shippingCountryCode = orderData?.shippingCountryCode || '';
      } catch (e) { /* ignore */ }

      const cleanPhone = normalizePhone(customerPhone, shippingCountryCode);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
      const checkoutUrl = `${baseUrl}/checkout/${orderNum}?id=${order.checkoutToken}`;

      const waMessage = [
        `🛒 *BangParjo Shop — Payment Link*`,
        ``,
        `Hi *${order.customerName || 'there'}*!`,
        ``,
        `Here's your payment link for order *#${orderNum}*:`,
        `${checkoutUrl}`,
        ``,
        `⏳ *Deadline: 24 hours*`,
        `If you have any questions, just reply to this message 😊`,
      ].join('\n');

      const result = await sendCustomWA(cleanPhone, waMessage);
      return { ...result, phone: cleanPhone, orderNum };
    },
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    // ── Get the last user message for intent detection ─────────────────────
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const userText = lastUserMsg?.content?.toLowerCase() || '';

    // ── Try to execute tools based on user intent ──────────────────────────
    let toolResults: any[] = [];

    // Detect order/tracking queries
    const orderMatch = userText.match(/order[#:\s]*([a-zA-Z0-9-]{5,})/i) || 
                       userText.match(/([a-zA-Z]+-\d+)/i);
    const trackingMatch = userText.match(/track(?:ing)?[#:\s]*([a-zA-Z0-9-]{5,})/i);

    // Detect product queries
    const pidMatch = userText.match(/(\d{15,25})/);  // CJ PID is long numeric

    // Detect phone number for WA
    const phoneMatch = userText.match(/(?:wa|whatsapp|send|send wa)\s*(?:to\s*)?(\d{8,15})/i);

    try {
      if (trackingMatch || (orderMatch && (userText.includes('track') || userText.includes('status') || userText.includes('where')))) {
        const identifier = trackingMatch?.[1] || orderMatch![1];
        if (identifier) {
          const result = await TOOLS[1].execute(identifier); // get_tracking_info
          toolResults.push({ tool: 'get_tracking_info', result });
        }
      } else if (orderMatch && (userText.includes('payment') || userText.includes('pay') || userText.includes('unpaid'))) {
        const orderNum = orderMatch[1];
        const result = await TOOLS[4].execute(orderNum); // send_payment_link
        toolResults.push({ tool: 'send_payment_link', result });
      } else if (orderMatch && !userText.includes('track')) {
        const orderNum = orderMatch[1];
        const result = await TOOLS[0].execute(orderNum); // get_order_status
        toolResults.push({ tool: 'get_order_status', result });
      }

      if (pidMatch) {
        const pid = pidMatch[1];
        const result = await TOOLS[3].execute(pid); // get_product_details
        toolResults.push({ tool: 'get_product_details', result });
      }

      if (phoneMatch && (userText.includes('message') || userText.includes('send') || userText.includes('notify'))) {
        const phone = phoneMatch[1];
        // Extract message after "send" or "message" keyword
        const msgMatch = userText.match(/(?:send|message)\s*(?:\w+\s+)?\d{8,15}\s+(.+)/i);
        const message = msgMatch?.[1] || 'Hello from BangParjo Shop!';
        const result = await TOOLS[2].execute(phone, message); // send_wa_notification
        toolResults.push({ tool: 'send_wa_notification', result });
      }
    } catch (toolError: any) {
      console.warn('[AI Chat] Tool execution error:', toolError.message);
      // Continue without tool results - Gemini can still respond
    }

    // ── Build system context with tool results ─────────────────────────────
    let systemContext = `You are Parjo AI, a professional e-commerce assistant for bangparjo.shop. 
The store sells global products via BangParjo e-commerce to the global market.
Keep responses helpful, polite, short (max 3 paragraphs), and use English.
Current date: ${new Date().toLocaleDateString()}.

IMPORTANT CAPABILITIES - You have REAL-TIME access to:
1. Order status & tracking - can look up any order
2. Product details - can look up any product by its CJ ID
3. WhatsApp notifications - can send messages to customers
4. Payment links - can resend payment links for unpaid orders

Always format order/phone numbers clearly and provide direct answers.
When the user asks about an order, product, or sending a message, USE the real data below.`;

    if (toolResults.length > 0) {
      systemContext += `\n\n=== REAL-TIME DATA RETRIEVED ===\n${JSON.stringify(toolResults, null, 2)}\n=== END DATA ===`;
    }

    // ── Call DeepSeek API ──────────────────────────────────────────────────
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'sk-your-deepseek-api-key-here') {
      console.error('Chat API Error: DEEPSEEK_API_KEY is not defined in .env');
      return NextResponse.json({ success: false, message: 'DeepSeek API Key missing' }, { status: 500 });
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY.trim()}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemContext },
          ...messages.map((m: any) => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('DeepSeek API Error:', data);
      throw new Error(data.error?.message || 'Failed to fetch from DeepSeek');
    }

    const aiText = data.choices?.[0]?.message?.content || "I'm sorry, I am experiencing technical difficulties. Please try again later.";

    return NextResponse.json({ success: true, text: aiText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
