# Razorpay Integration Guide

## For Custom Platform Merchants (Magic Checkout)

### Step 1: Register Your Shipping-Info API

1. Log in to Razorpay Dashboard
2. Go to **Magic Checkout → Setup & Settings → Platform Settings**
3. Select **Custom E-Commerce Platform**
4. Under **Shipping Setup**, select **API** as the shipping service type
5. Enter your Worker URL:
   ```
   https://your-worker.workers.dev/razorpay/shipping-info
   ```

### Step 2: Register Your Promotions API

1. Go to **Checkout Settings → Coupon Settings**
2. Enter your promotions URL:
   ```
   https://your-worker.workers.dev/razorpay/get-promotions
   ```

### Step 3: Enable COD

1. Contact Razorpay Support to enable COD on your account
2. Or go to **Magic Checkout → COD Settings → COD Setup**

### Step 4: Enable COD Intelligence (Optional)

1. Go to **RTO Reduction Setup → RTO Reduction**
2. Toggle on **COD Intelligence**

### How It Works

When a customer enters their address at checkout:

1. Razorpay calls your `/razorpay/shipping-info` endpoint
2. Your Worker calculates the risk score for that pincode
3. If risk > threshold, you return `cod: false` — COD is hidden
4. If risk is medium, Razorpay's COD Intelligence may still show COD with a prepaid nudge
5. Razorpay calls your `/razorpay/get-promotions` to show available coupons
6. High-risk customers see a prepaid-only discount

### Test Flow

```bash
# Test shipping-info endpoint
curl -X POST https://your-worker.workers.dev/razorpay/shipping-info \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test_123",
    "razorpay_order_id": "order_test",
    "email": "test@example.com",
    "contact": "+919876543210",
    "addresses": [{
      "id": "0",
      "zipcode": "847101",
      "state_code": "BR",
      "country": "IN"
    }]
  }'

# Expected response: cod: false (high RTO pincode)
```

## For WooCommerce Merchants

Install the `rto-firewall.php` plugin. See `integrations/woocommerce/readme.txt` for setup.

## For Custom Sites (Non-Magic Checkout)

Use the client SDK:

```html
<script type="module">
  import { RTOFirewall } from './client-sdk.js';

  const firewall = new RTOFirewall({
    endpoint: 'https://your-worker.workers.dev/api/score',
    threshold: 75,
  });

  const risk = await firewall.score({
    pincode: '847101',
    name: 'Test User',
    email: 'test@example.com',
  });

  if (firewall.shouldHideCOD(risk)) {
    // Hide COD, show prepaid discount
    document.getElementById('cod-option').style.display = 'none';
    document.getElementById('prepaid-banner').style.display = 'block';
  }
</script>
```
