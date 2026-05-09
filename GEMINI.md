# CJ Dropshipping Catalog Project

## Vision
Building a responsive Next.js product catalog for the Indonesian market using CJ Dropshipping API. The site will feature a landing page for specific products and a full catalog at `bangparjo.shop`.

## Tech Stack
- **Framework:** Next.js (App Router preferred)
- **Styling:** Vanilla CSS (Mobile-first responsive)
- **Language:** TypeScript
- **API:** CJ Dropshipping REST API

## API Configuration
- **Base URL:** `https://api.cjdropshipping.com`
- **Authentication:** `POST /v1/authentication/getAccessToken`
- **Key Endpoints:**
    - `GET /v1/product/list`: Search/Query products.
    - `GET /v1/product/details`: Product variants and attributes.
    - `POST /v1/logistic/getFreightFee`: Calculate shipping to Indonesia (Country Code: `ID`).

## Development Workflow
1. Use `CJ-Access-Token` header for all authenticated requests.
2. Focus on performance and SEO for the landing pages.
3. Ensure mobile responsiveness for Facebook Ads traffic.
