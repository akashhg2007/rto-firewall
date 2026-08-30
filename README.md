# RTO Firewall — COD Risk Scoring for Indian D2C

Pre-checkout RTO protection for merchants who don't have access to Razorpay's premium COD Intelligence. Dynamically hides Cash on Delivery for high-risk pincodes and nudges prepaid with a discount.

## Architecture

```
[Shopify / WooCommerce / Custom Site]
        |
        v
[Risk Scoring API]  ← Cloudflare Worker, <200ms
  - Pincode RTO lookup (KV)
  - Fake name detection
  - Device/time/product risk
        |
        v
[Decision: allow or block COD]
        |
        v
[Razorpay Webhooks] → Logs outcome → Feedback loop
```

## Quick Start

### 1. Deploy the Risk Engine

```bash
cd risk-engine
npm install

# Create KV namespace
npx wrangler kv namespace create RTO_DATA

# Update wrangler.toml with your namespace ID
# Edit wrangler.toml: replace YOUR_KV_NAMESPACE_ID

# Seed pincode data
npm run seed

# Deploy
npm run deploy
```

### 2. Test the API

```bash
# Health check
curl https://your-worker.workers.dev/api/health

# Score a high-risk pincode (should return score > 75)
curl -X POST https://your-worker.workers.dev/api/score \
  -H "Content-Type: application/json" \
  -d '{"pincode": "847101", "name": "test123"}'

# Score a low-risk pincode (should return score < 25)
curl -X POST https://your-worker.workers.dev/api/score \
  -H "Content-Type: application/json" \
  -d '{"pincode": "560038", "name": "Rahul Kumar"}'
```

### 3. Integrate with Your Platform

**Razorpay Magic Checkout:**
See `integrations/razorpay/setup.md`

**WooCommerce:**
Copy `integrations/woocommerce/rto-firewall.php` to `wp-content/plugins/`
Copy `integrations/woocommerce/blocks-checkout.js` to the same directory
Activate plugin in WordPress admin

**Custom Site:**
```html
<script type="module">
  import { RTOFirewall } from './client-sdk.js';
  const firewall = new RTOFirewall({ endpoint: 'YOUR_API_URL' });
  const risk = await firewall.score({ pincode: '847101' });
  if (firewall.shouldHideCOD(risk)) { /* hide COD */ }
</script>
```

### 4. Run the Dashboard

```bash
cd dashboard
npm install
npm run dev
# Opens at http://localhost:5173
```

## Risk Scoring

| Signal | Weight | Data Source |
|--------|--------|-------------|
| Pincode RTO rate | 35% | KV database (500+ pincodes) |
| Name legitimacy | 25% | Regex pattern matching |
| Device risk | 15% | User-Agent parsing |
| Time of order | 10% | Hour-of-day risk |
| Product category | 15% | Merchant-configurable map |

**Threshold:** Default 75% — orders above this get COD hidden.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/score` | POST | Calculate RTO risk score |
| `/api/health` | GET | Health check |
| `/razorpay/shipping-info` | POST | Magic Checkout shipping API |
| `/razorpay/get-promotions` | POST | Magic Checkout promotions API |
| `/webhook/razorpay` | POST | Razorpay webhook receiver |
| `/api/dashboard/stats` | GET | Dashboard metrics |
| `/api/dashboard/audit` | GET | Audit log |

## Dashboard

The dashboard shows:
- **Overview:** Orders analyzed, blocked, money saved, conversion rate
- **Audit Log:** Every blocked/allowed decision with full reasoning
- **Settings:** Configurable risk threshold and prepaid discount

## How It Differs from Razorpay COD Intelligence

Razorpay's COD Intelligence is a premium feature for merchants already on Magic Checkout. This tool extends similar protection to merchants using:
- Razorpay Standard Checkout
- WooCommerce with basic Razorpay integration
- Custom sites without Magic Checkout
- Instagram/WhatsApp sellers via Payment Links

We provide merchant-customizable rules, full transparency into why orders are blocked, and a feedback loop that improves over time.

## License

MIT
