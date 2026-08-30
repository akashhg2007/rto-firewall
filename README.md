# RTO Firewall — COD Risk Scoring for Indian D2C

Pre-checkout RTO protection for merchants who don't have access to Razorpay's premium COD Intelligence. Dynamically hides Cash on Delivery for high-risk pincodes and nudges prepaid with a discount.

## Quick Start

```bash
# Install dependencies
npm install
cd risk-engine && npm install && cd ..
cd dashboard && npm install && cd ..

# Run everything (risk engine + dashboard + demo page)
npm run dev
```

This starts:
- **Risk Engine**: http://localhost:8787
- **Dashboard**: http://localhost:5173
- **Demo Page**: http://localhost:3000

## Architecture

```
[Shopify / WooCommerce / Custom Site]
        |
        v
[Risk Scoring API]  ← Cloudflare Worker, <200ms
  - Pincode RTO lookup (500+ pincodes)
  - Fake name detection (16 patterns)
  - Device/time/product risk
        |
        v
[Decision: allow or block COD]
        |
        v
[Razorpay Webhooks] → Logs outcome → Feedback loop
```

## What's Inside

### Risk Engine (`risk-engine/`)
- **7 API endpoints** — scoring, Razorpay integration, webhooks, dashboard
- **500+ Indian pincodes** with RTO rates across Bihar, UP, Delhi, Karnataka, Maharashtra, etc.
- **Weighted rule engine** — pincode (50%), name (30%), device (5%), time (5%), product (10%)
- **CSV upload** — merchants can import their own RTO history data

### Integrations (`integrations/`)
- **Razorpay** — shipping-info API + promotions API for Magic Checkout
- **WooCommerce** — PHP plugin with dual classic/block checkout support
- **Shopify** — Payment Customization Function (hides COD for high-risk)
- **Custom Site** — Vanilla JS SDK + React hook

### Dashboard (`dashboard/`)
- **Overview** — orders analyzed, blocked, money saved, conversion rate
- **Audit Log** — every blocked/allowed decision with full reasoning + pagination
- **Settings** — configurable risk threshold and prepaid discount

### Demo Page (`demo/`)
- **Side-by-side checkout comparison** — standard vs firewall
- **3 pre-built scenarios** — Rahul (low risk), Test User (high risk), Medium risk
- **Live API test** — test any pincode/name combination

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/score` | POST | Calculate RTO risk score |
| `/api/health` | GET | Health check |
| `/razorpay/shipping-info` | POST | Magic Checkout shipping API |
| `/razorpay/get-promotions` | POST | Magic Checkout promotions API |
| `/webhook/razorpay` | POST | Razorpay webhook (HMAC verified) |
| `/api/dashboard/stats` | GET | Dashboard metrics |
| `/api/dashboard/audit` | GET | Paginated audit log |
| `/api/upload/pincodes` | POST | Upload custom pincode data |

## Risk Scoring

| Signal | Weight | Data Source |
|--------|--------|-------------|
| Pincode RTO rate | 50% | KV database (500+ pincodes) |
| Name legitimacy | 30% | Regex pattern matching |
| Device risk | 5% | User-Agent parsing |
| Time of order | 5% | Hour-of-day risk |
| Product category | 10% | Merchant-configurable map |

**Threshold:** Default 75% — orders above this get COD hidden.

## Test Results

```
[PASS] Darbhanga + fake name    → 83% BLOCKED
[PASS] Bangalore + real name    → 10% ALLOWED
[PASS] Araria + keyboard        → 83% BLOCKED
[PASS] Delhi + real name        → 16% ALLOWED
[PASS] Darbhanga + no name      → 77% BLOCKED
[PASS] Bangalore + test name    → 35% ALLOWED
[PASS] Mumbai + real name       → 14% ALLOWED
```

## How It Differs from Razorpay COD Intelligence

Razorpay's COD Intelligence is a premium feature for merchants already on Magic Checkout. This tool extends similar protection to merchants using:
- Razorpay Standard Checkout
- WooCommerce with basic Razorpay integration
- Custom sites without Magic Checkout
- Instagram/WhatsApp sellers via Payment Links

We provide merchant-customizable rules, full transparency into why orders are blocked, and a feedback loop that improves over time.

## Deploy to Cloudflare

```bash
cd risk-engine
npx wrangler kv namespace create RTO_DATA
# Update wrangler.toml with your namespace ID
npm run seed
npm run deploy
```

## License

MIT
