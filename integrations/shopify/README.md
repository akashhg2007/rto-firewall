# RTO Firewall — Shopify Integration

## How It Works

This Shopify Function hides the "Cash on Delivery" payment method when the customer's pincode has a high RTO risk score (>75%).

## Setup

### Prerequisites
- Shopify CLI installed (`npm install -g @shopify/cli`)
- A Shopify Partners account with a development store

### Install

```bash
cd integrations/shopify/extensions/rto-hide-cod
npm install
shopify app generate extension --template payment_customization --name rto-hide-cod
```

### Deploy

```bash
shopify app deploy
```

### Activate

1. Go to your Shopify Admin → Settings → Payments
2. Enable Cash on Delivery as a manual payment method
3. The function will automatically hide COD for high-risk pincodes

## How It Works

1. Customer enters their shipping address at checkout
2. The function reads the zip code from `cart.buyerIdentity.deliveryAddress`
3. It calls the RTO Firewall risk API with the pincode
4. If risk score > 75%, the COD payment method is hidden
5. UPI, Card, and Net Banking remain available

## Configuration

Edit `src/run.ts` to change:
- `RISK_API_URL` — your Cloudflare Worker endpoint
- `RISK_THRESHOLD` — the score threshold (default: 75)
