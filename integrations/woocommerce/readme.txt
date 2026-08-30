=== RTO Firewall for Razorpay ===
Contributors: rtofirewall
Tags: woocommerce, razorpay, cod, rto, payments
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
WC requires at least: 5.0
WC tested up to: 9.0
Stable tag: 1.0.0
License: GPLv2 or later

Dynamic COD risk scoring for WooCommerce — hides Cash on Delivery for high-risk pincodes and nudges customers toward prepaid with a discount.

== Description ==

RTO Firewall plugs into your WooCommerce checkout and calls a risk scoring API before showing the COD payment option. For high-risk pincodes (based on historical RTO data), COD is hidden and a prepaid discount is offered instead.

**Features:**

* Real-time RTO risk scoring via Cloudflare Worker API
* Dual checkout support: Classic (PHP filter) + Block checkout (JavaScript)
* Configurable risk threshold (0-100)
* Configurable prepaid discount percentage
* Audit log of all blocked/allowed decisions
* Works with Razorpay Standard Checkout and Magic Checkout

**How it works:**

1. Customer enters shipping postcode at checkout
2. Plugin calls your Risk API with the postcode
3. If risk score > threshold, COD is hidden
4. Prepaid options (UPI, Card, Netbanking) remain available

== Installation ==

1. Upload the `rto-firewall` folder to `/wp-content/plugins/`
2. Activate through the 'Plugins' menu
3. Go to WooCommerce > RTO Firewall Settings
4. Enter your Risk API endpoint URL
5. Set your preferred threshold (default: 75)

== Frequently Asked Questions ==

= Does this work with block checkout? =

Yes. The plugin supports both classic shortcode checkout and the newer WooCommerce block checkout.

= What happens if the API is unreachable? =

COD remains visible — we fail open to avoid blocking legitimate orders.

= Can I customize the product risk mapping? =

Product risk is configured on the Cloudflare Worker side via merchant config in KV.

== Changelog ==

= 1.0.0 =
* Initial release
* Classic checkout support via `woocommerce_available_payment_gateways`
* Block checkout support via `registerPaymentMethodExtensionCallbacks`
* Admin settings page
