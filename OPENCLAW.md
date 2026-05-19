# OpenClaw Integration — BangParjo Shop

This document explains how OpenClaw (WhatsApp AI Agent) integrates with the BangParjo Shop website.

---

## 📋 Table of Contents

1. [Architecture](#1-architecture)
2. [Webhook Endpoint](#2-webhook-endpoint)
3. [Actions / Commands](#3-actions--commands)
4. [Automatic Notifications](#4-automatic-notifications)
5. [Example Scenarios](#5-example-scenarios)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VPS / Server                          │
│  ┌──────────────┐         ┌──────────────────────────┐  │
│  │  OpenClaw    │ ──────▶ │  WhatsApp Business API   │  │
│  │  (AI Agent)  │         │  (Send/Receive Messages) │  │
│  └──────┬───────┘         └──────────────────────────┘  │
│         │                                               │
│         │ HTTP (Bearer Token)                           │
│         ▼                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │          BangParjo Website (Next.js)              │   │
│  │                                                   │   │
│  │  /api/webhooks/openclaw  ← OpenClaw calls this   │   │
│  │  /api/openclaw           ← Client-side calls      │   │
│  │  /api/orders/send-link   ← Sends email + WA      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### New Order Notification Flow:

```
Customer clicks "Place Order"
        │
        ▼
Order saved to database
        │
        ▼
WA notification to Admin (via /api/openclaw)
  → "🛒 NEW ORDER - #ORD-xxx"
        │
        ▼
Customer redirected to payment page
        │
        ▼
Email + WhatsApp sent to Customer (via /api/orders/send-link)
  → "🛒 Payment link for #ORD-xxx"
        │
        ▼
WA notification to Admin (via /api/orders/send-link)
  → "🛒 NEW ORDER — Link Sent"
```

---

## 2. Webhook Endpoint

### Base URL

```
https://bangparjo.shop/api/webhooks/openclaw
```

### Authentication

All requests MUST include the following header:

```
Authorization: Bearer {OPENCLAW_TOKEN}
```

This token is the same as `OPENCLAW_TOKEN` in the `.env` file:
```
OPENCLAW_TOKEN=29cbad6c21363cc3c933bc5cf78640ee1583e39ef38502d5
```

### Request Format

```json
{
  "action": "action-name",
  "data": {
    // parameters for the action
  }
}
```

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 3. Actions / Commands

### 3.1 `send-wa` — Send Custom WhatsApp Message

Send a WhatsApp message to any phone number worldwide.

**Request:**
```json
{
  "action": "send-wa",
  "data": {
    "target": "6281234567890",
    "message": "Hello! Check out our special promotion 🎉"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | ✅ | Target phone number (international format, e.g., 628xxx, 1415xxxxxxx). No leading + |
| `message` | string | ✅ | Text message (supports WhatsApp markdown: *bold*, _italic_) |

---

### 3.2 `send-payment-link` — Send Payment Link

Send the payment checkout link to a customer via WhatsApp.

**Request:**
```json
{
  "action": "send-payment-link",
  "data": {
    "orderNum": "ORD-1718000000000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderNum` | string | ✅ | Order number (format: ORD-xxxxxxxxxx) |

**Message sent to customer:**
```
🛒 BangParjo Shop — Payment Link

Hi *Customer*!

Here's your payment link for order *#ORD-1718000000000*:
https://bangparjo.shop/checkout/ORD-xxx?id=token

⏳ Deadline: 24 hours
If you have any questions, just reply to this message 😊
```

> **Phone number handling:** The system automatically detects the customer's country from their shipping address and normalizes the phone number accordingly. Supports all countries worldwide.

---

### 3.3 `notify-status` — Send Order Status Notification

Send an order status update notification to the customer.

**Request:**
```json
{
  "action": "notify-status",
  "data": {
    "orderNum": "ORD-1718000000000",
    "status": "SHIPPED"
  }
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderNum` | string | ✅ | Order number |
| `status` | string | ✅ | Order status: `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `message` | string | ❌ | Custom message (if empty, uses default template) |

**Default message templates per status:**

| Status | Emoji | Label | Message |
|--------|-------|-------|---------|
| `PAID` | ✅ | Payment Received | Payment for order #ORD-xxx has been received. We'll process your order right away! |
| `PROCESSING` | 🔧 | Processing | Order #ORD-xxx is now being processed. Stay tuned for updates! |
| `SHIPPED` | 📦 | Shipped | Order #ORD-xxx has been shipped! Track your package using the tracking number. |
| `DELIVERED` | 🎉 | Delivered | Order #ORD-xxx has been delivered! Thank you for shopping at BangParjo Shop 😊 |
| `CANCELLED` | ❌ | Cancelled | Order #ORD-xxx has been cancelled. Contact us if you have any questions. |

---

### 3.4 `get-order` — Get Order Data

Retrieve order details by order number.

**Request:**
```json
{
  "action": "get-order",
  "data": {
    "orderNum": "ORD-1718000000000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNum": "ORD-1718000000000",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "08123456789",
    "totalAmount": 45.99,
    "status": "UNPAID",
    "trackingNumber": null,
    "createdAt": "2026-05-18T08:00:00.000Z"
  }
}
```

---

### 3.5 `order-created` — Order Created (Auto-triggered)

This action is **automatically triggered** when a customer clicks "Place Order" on the checkout page. It sends a WhatsApp message to the customer with their payment link.

**Trigger:** Called automatically by `POST /api/orders` when order is saved.

**Request (sent by system):**
```json
{
  "action": "order-created",
  "data": {
    "orderNum": "ORD-1718000000000",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "08123456789",
    "totalAmount": 45.99,
    "status": "UNPAID",
    "shippingCountryCode": "ID",
    "checkoutUrl": "https://bangparjo.shop/checkout/ORD-xxx?id=token",
    "createdAt": "2026-05-18T08:00:00.000Z"
  }
}
```

**Message sent to customer:**
```
🛒 BangParjo Shop — Order Confirmation

Hi *John*! 👋

Thank you for your order!
Your order *#ORD-1718000000000* has been received.

🔗 Complete your payment here:
https://bangparjo.shop/checkout/ORD-xxx?id=token

⏳ Payment deadline: 24 hours
Once paid, we'll process your order right away.

If you have any questions, just reply to this message 😊

— BangParjo Shop
```

> **Note:** OpenClaw can also listen for this event and respond with custom logic, such as asking the customer if they need help with payment.

---

### 3.6 `list-orders` — List Recent Orders

Get a list of recent orders, optionally filtered by status.

**Request:**
```json
{
  "action": "list-orders",
  "data": {
    "limit": 5,
    "status": "UNPAID"
  }
}
```

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | ❌ | 10 | Number of orders (max 50) |
| `status` | string | ❌ | - | Filter by status: `UNPAID`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |

---

## 4. Automatic Notifications

In addition to the webhook, the system automatically sends notifications to the **Admin** via WhatsApp.

### 4.1 New Order (from `/api/orders`)

Sent when a customer successfully completes checkout.

```
🛒 NEW ORDER

Order: #ORD-1718000000000
Name: John Doe
Total: $45.99
Status: UNPAID

https://bangparjo.com/admin/orders
```

### 4.2 Link Sent (from `/api/orders/send-link`)

Sent after email and WhatsApp have been sent to the customer.

```
🛒 NEW ORDER — Link Sent

Order: #ORD-1718000000000
Name: John Doe
Email: john@example.com
Phone: 08123456789
Country: ID
Email sent: ✅
WA sent: ✅

🔗 https://bangparjo.shop/checkout/ORD-xxx?id=token
```

### 4.3 Payment Received (from `/api/openclaw`)

Can be triggered by OpenClaw or the system when payment succeeds.

```
💳 PAYMENT RECEIVED

Order: #ORD-1718000000000
Amount: $45.99
Method: Midtrans QRIS

https://bangparjo.com/admin/orders
```

### 4.4 Order Shipped (from `/api/openclaw`)

Can be triggered when admin updates the tracking number.

```
📦 ORDER SHIPPED

Order: #ORD-1718000000000
Tracking: CJ123456789

https://bangparjo.com/admin/orders
```

---

## 5. Example Scenarios

### Scenario 1: Customer asks about order status

**Customer chat:** "Hi, where is my order #ORD-1718000000000?"

**OpenClaw calls:**
```json
{
  "action": "get-order",
  "data": { "orderNum": "ORD-1718000000000" }
}
```

**Response:** `{ status: "SHIPPED", trackingNumber: "CJ123..." }`

**OpenClaw replies:** "Your order has been shipped! Tracking number: CJ123..."

---

### Scenario 2: Customer asks for payment link

**Customer chat:** "Can you send me the payment link again? I lost it"

**OpenClaw calls:**
```json
{
  "action": "send-payment-link",
  "data": { "orderNum": "ORD-1718000000000" }
}
```

**Response:** WA is automatically sent to the customer with the payment link.

---

### Scenario 3: Admin updates order to SHIPPED

**Admin clicks "Ship" in dashboard → triggers OpenClaw:**

**OpenClaw calls:**
```json
{
  "action": "notify-status",
  "data": {
    "orderNum": "ORD-1718000000000",
    "status": "SHIPPED"
  }
}
```

**Response:** WA sent to customer: "📦 Order #ORD-xxx has been shipped!"

---

### Scenario 4: OpenClaw sends promotion to unpaid customers

**OpenClaw calls:**
```json
{
  "action": "list-orders",
  "data": {
    "status": "UNPAID",
    "limit": 50
  }
}
```

**Response:** List of unpaid customers → OpenClaw sends WA one by one.

---

### Scenario 5: Customer from the US places an order

**Customer info:**
- Phone: "+1 (555) 123-4567"
- Country: "US"

**System automatically normalizes to:** `15551234567`

**WA sent to:** `15551234567` ✅ (US number works!)

---

## 6. Phone Number Format Support

The system supports phone numbers from **all countries worldwide**. Here's how it works:

### Input Formats Accepted

| Format | Example | Description |
|--------|---------|-------------|
| Local | `08123456789` | Local number (uses country code from shipping address) |
| International with + | `+628123456789` | Standard international format |
| International without + | `628123456789` | International format, no prefix |
| US/Canada | `(555) 123-4567` | With area code in parentheses |
| With dashes | `0812-3456-7890` | With dashes or spaces |
| With 00 prefix | `00628123456789` | International call prefix |

### Country Code Detection

The system detects the country from the `shippingCountryCode` field in the order data (ISO 2-letter code, e.g., `ID`, `US`, `GB`, `JP`). It supports **100+ countries** across all continents.

If the country is unknown, it defaults to Indonesia (`62`).

---

## 7. Troubleshooting

### 7.1 WhatsApp not sent

**Check:**
1. Is `OPENCLAW_TOKEN` configured in `.env`?
2. Is the OpenClaw server running at `127.0.0.1:18789`?
3. Check server logs: `pm2 logs openclaw`
4. Check website logs: `pm2 logs bangparjo`

### 7.2 Webhook returns 401

**Cause:** Token mismatch.
**Solution:** Ensure the `Authorization: Bearer {TOKEN}` header uses the same token as `OPENCLAW_TOKEN` in `.env`.

### 7.3 Webhook returns 404

**Cause:** Wrong endpoint URL.
**Solution:** Use the full URL: `https://bangparjo.shop/api/webhooks/openclaw`

### 7.4 Order not found

**Cause:** Invalid order number.
**Solution:** Ensure `orderNum` starts with `ORD-` and the order actually exists in the database.

### 7.5 Invalid phone number

**Cause:** Phone number is too short or invalid.
**Solution:** Ensure the customer's phone number includes the country code or area code. The system will try to normalize it, but very short numbers (< 10 digits) will be rejected.

---

## Appendix: Related Files

| File | Function |
|------|----------|
| `src/lib/openclaw-client.ts` | **NEW** Enhanced client for OpenClaw + CJ notifications |
| `src/lib/openclaw.ts` | Legacy client (re-exports from openclaw-client) |
| `src/lib/phone.ts` | Phone number normalization utility (global support) |
| `src/app/api/openclaw/route.ts` | API Gateway for client-side components |
| `src/app/api/webhooks/openclaw/route.ts` | **Webhook endpoint for OpenClaw** (v2.0) |
| `src/app/api/cjdropship/webhook/route.ts` | **NEW** Enhanced CJ webhook with OpenClaw integration |
| `src/app/api/webhooks/cj/route.ts` | Legacy CJ webhook (updated with OpenClaw) |
| `src/app/api/admin/cjdropship-webhook/route.ts` | **NEW** CJ webhook registration API |
| `src/app/api/orders/send-link/route.ts` | Sends email + WhatsApp to customer |
| `src/app/api/orders/route.ts` | Order CRUD + admin notification |
| `.env` | Configuration for `OPENCLAW_TOKEN` and `OPENCLAW_URL` |

---

> **Note:** To add new actions, edit `src/app/api/webhooks/openclaw/route.ts` and add a new case in the switch statement.
