(function() {
    'use strict';

    function fixCartDisplay() {
        // Get elements
        const emptyCart = document.getElementById('emptyCart');
        const cartItems = document.querySelector('.cart-items');

        if (!emptyCart || !cartItems) return;

        // Check if there are actual product cards (.ci-card)
        const productCards = cartItems.querySelectorAll('.ci-card');

        if (productCards.length > 0) {
            // Products exist - HIDE empty cart message
            emptyCart.style.setProperty('display', 'none', 'important');
        } else {
            // No products - SHOW empty cart message
            emptyCart.style.setProperty('display', 'block', 'important');
        }
    }

    // Run immediately
    fixCartDisplay();

    // Run when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixCartDisplay);
    }

    // Run again after 1 sec (in case items load dynamically)
    setTimeout(fixCartDisplay, 500);
    setTimeout(fixCartDisplay, 1500);

    // Watch for changes
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            fixCartDisplay();
        });

        const startObserving = function() {
            const cartItems = document.querySelector('.cart-items');
            if (cartItems) {
                observer.observe(cartItems, { childList: true, subtree: true });
                fixCartDisplay();
            } else {
                setTimeout(startObserving, 100);
            }
        };
        startObserving();
    }
})();
