(function() {
    'use strict';

    if (typeof wc === 'undefined' || typeof wc.wcBlocksRegistry === 'undefined') {
        return;
    }

    var config = window.rtoFirewallConfig || {
        apiEndpoint: 'https://rto-firewall.your-domain.workers.dev/api/score',
        threshold: 75,
        discountPercent: 10,
    };

    var riskCache = {};

    function getRiskScore(postcode) {
        if (riskCache[postcode]) {
            return Promise.resolve(riskCache[postcode]);
        }

        return fetch(config.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pincode: postcode,
                time: Date.now(),
            }),
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            riskCache[postcode] = data;
            return data;
        })
        .catch(function() {
            return { score: 0, action: 'allow' };
        });
    }

    function registerCallbacks() {
        if (typeof wc.wcBlocksRegistry.registerPaymentMethodExtensionCallbacks === 'function') {
            wc.wcBlocksRegistry.registerPaymentMethodExtensionCallbacks(
                'rto-firewall',
                {
                    cod: function(args) {
                        var postcode = '';
                        if (args && args.shippingAddress && args.shippingAddress.postcode) {
                            postcode = args.shippingAddress.postcode;
                        } else if (args && args.billingAddress && args.billingAddress.postcode) {
                            postcode = args.billingAddress.postcode;
                        }

                        if (!postcode) return true;

                        return getRiskScore(postcode).then(function(risk) {
                            return risk.score <= config.threshold;
                        });
                    },
                }
            );
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerCallbacks);
    } else {
        registerCallbacks();
    }
})();
