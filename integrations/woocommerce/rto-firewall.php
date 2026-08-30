<?php
/**
 * Plugin Name: RTO Firewall for Razorpay
 * Description: Dynamic COD risk scoring — hides COD for high-risk pincodes, nudges prepaid with discount
 * Version: 1.0.0
 * Author: RTO Firewall
 * Text Domain: rto-firewall
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 */

if (!defined('ABSPATH')) exit;

class RTO_Firewall {
    private $api_endpoint;
    private $threshold;
    private $discount_percent;

    public function __construct() {
        $this->api_endpoint = get_option('rto_firewall_api_endpoint', 'https://rto-firewall.your-domain.workers.dev/api/score');
        $this->threshold = (int) get_option('rto_firewall_threshold', 75);
        $this->discount_percent = (int) get_option('rto_firewall_discount', 10);

        add_filter('woocommerce_available_payment_gateways', array($this, 'filter_gateways_classic'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_block_checkout_script'));
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function filter_gateways_classic($gateways) {
        if (is_admin()) return $gateways;
        if (!WC()->cart) return $gateways;

        $postcode = WC()->customer ? WC()->customer->get_shipping_postcode() : null;
        if (!$postcode) return $gateways;

        $billing_postcode = WC()->customer ? WC()->customer->get_billing_postcode() : null;
        $email = WC()->customer ? WC()->customer->get_email() : null;
        $first_name = WC()->customer ? WC()->customer->get_first_name() : null;

        $risk = $this->call_risk_api($postcode, $email, $first_name);

        if ($risk && $risk['score'] > $this->threshold && isset($gateways['cod'])) {
            unset($gateways['cod']);
        }

        return $gateways;
    }

    public function enqueue_block_checkout_script() {
        if (!function_exists('is_checkout') || !is_checkout()) return;

        wp_enqueue_script(
            'rto-firewall-blocks',
            plugin_dir_url(__FILE__) . 'blocks-checkout.js',
            array(),
            '1.0.0',
            true
        );

        wp_localize_script('rto-firewall-blocks', 'rtoFirewallConfig', array(
            'apiEndpoint' => $this->api_endpoint,
            'threshold' => $this->threshold,
            'discountPercent' => $this->discount_percent,
        ));
    }

    private function call_risk_api($pincode, $email = null, $name = null) {
        $body = json_encode(array(
            'pincode' => $pincode,
            'email' => $email,
            'name' => $name,
            'time' => time() * 1000,
        ));

        $response = wp_remote_post($this->api_endpoint, array(
            'body' => $body,
            'headers' => array('Content-Type' => 'application/json'),
            'timeout' => 3,
            'blocking' => true,
        ));

        if (is_wp_error($response)) return null;

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) return null;

        return json_decode(wp_remote_retrieve_body($response), true);
    }

    public function add_settings_page() {
        add_submenu_page(
            'woocommerce',
            'RTO Firewall Settings',
            'RTO Firewall',
            'manage_woocommerce',
            'rto-firewall',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('rto_firewall_options', 'rto_firewall_api_endpoint');
        register_setting('rto_firewall_options', 'rto_firewall_threshold');
        register_setting('rto_firewall_options', 'rto_firewall_discount');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>RTO Firewall Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('rto_firewall_options'); ?>
                <table class="form-table">
                    <tr>
                        <th>Risk API Endpoint</th>
                        <td>
                            <input type="url" name="rto_firewall_api_endpoint"
                                   value="<?php echo esc_attr(get_option('rto_firewall_api_endpoint')); ?>"
                                   class="regular-text" placeholder="https://your-worker.workers.dev/api/score" />
                            <p class="description">Your Cloudflare Worker risk scoring API URL</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Risk Threshold (0-100)</th>
                        <td>
                            <input type="number" name="rto_firewall_threshold"
                                   value="<?php echo esc_attr(get_option('rto_firewall_threshold', 75)); ?>"
                                   min="0" max="100" />
                            <p class="description">Orders above this score get COD hidden (default: 75)</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Prepaid Discount %</th>
                        <td>
                            <input type="number" name="rto_firewall_discount"
                                   value="<?php echo esc_attr(get_option('rto_firewall_discount', 10)); ?>"
                                   min="0" max="50" />
                            <p class="description">Discount offered to high-risk customers for prepaid (default: 10%)</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Settings'); ?>
            </form>
        </div>
        <?php
    }
}

new RTO_Firewall();
