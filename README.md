# CJ Dropshipping Catalog - Professional E-Commerce

A high-performance, modern e-commerce platform built with Next.js, integrated directly with the CJ Dropshipping API. Designed for the Indonesian market with seamless global shipping support and automated fulfillment.

## 🚀 Features

- **Dynamic Product Catalog**: Real-time product search and import from CJ Dropshipping.
- **Admin Dashboard**: Manage inventory, profit margins, and store settings with a clean, professional UI.
- **Hero Section Management**: Curate specific products to be featured on the homepage.
- **Tiered Pricing Engine**: Automatically calculate selling prices based on customizable profit margin rules.
- **Global Shipping**: Real-time shipping cost calculation for 200+ countries.
- **Hybrid Payment System**: 
  - **Midtrans**: For Indonesian local payments (VA, QRIS, GoPay).
  - **PayPal**: For global customers.
- **Automated Fulfillment**: Webhook-driven synchronization with CJ Dropshipping to process orders automatically upon payment.
- **Advanced SEO**: Pre-configured metadata, OpenGraph tags, and sitemap readiness.
- **Analytics Ready**: Built-in support for Google Analytics and Facebook Pixel.

## 🛠 Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **API Integration**: CJ Dropshipping REST API V2
- **Styling**: Vanilla CSS (Zinc/Shadcn inspired design)

## 📦 Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- CJ Dropshipping API Key
- Midtrans & PayPal Developer Accounts

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cjropshiper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/cj_dropshipping"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # CJ Dropshipping
   CJ_API_KEY="your_cj_api_key"
   CJ_API_BASE_URL="https://api.cjdropshipping.com"

   # Midtrans
   MIDTRANS_SERVER_KEY="your_midtrans_server_key"
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="your_midtrans_client_key"
   MIDTRANS_IS_PRODUCTION=false

   # PayPal
   NEXT_PUBLIC_PAYPAL_CLIENT_ID="your_paypal_client_id"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🔐 Webhook Configuration

For automated fulfillment, you must configure your payment gateway webhooks to point to the following endpoints:

- **Midtrans**: `https://yourdomain.com/api/midtrans/webhook`
- **PayPal**: `https://yourdomain.com/api/paypal/webhook`

## 📁 Project Structure

- `src/app`: Next.js App Router (Pages and API Routes)
- `src/components`: Reusable UI components
- `src/context`: React Context providers (Cart, Settings)
- `src/lib`: Core logic (CJ API, Pricing, Fulfillment)
- `prisma`: Database schema and migrations
- `public`: Static assets

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for the Dropshipping Community.
