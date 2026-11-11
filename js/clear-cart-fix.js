(function() {
    'use strict';

    // Universal clear cart function
    window.clearCart = function() {
        if (confirm('Are you sure you want to clear your cart?')) {
            // Clear localStorage
            localStorage.removeItem('cart');
            localStorage.setItem('cart', '[]');

            // Reload page to show empty state
            window.location.reload();
        }
        return false;
    };

    // Auto-attach to clear cart buttons
    function attachClearCartHandlers() {
        // Find all possible clear cart buttons
        const selectors = [
            '[onclick*="clearCart"]',
            '.clear-cart',
            '.btn-clear-cart',
            'button:contains("Clear Cart")',
            'a:contains("Clear Cart")'
        ];

        // Also find buttons with "Clear Cart" text
        document.querySelectorAll('button, a').forEach(function(el) {
            const text = (el.textContent || '').trim().toLowerCase();
            if (text.includes('clear cart') || text === 'clear cart') {
                el.style.cursor = 'pointer';

                // Remove existing onclick to avoid conflicts
                el.onclick = null;

                // Add fresh handler
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.clearCart();
                });
            }
        });
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachClearCartHandlers);
    } else {
        attachClearCartHandlers();
    }

    // Run again after delay (dynamic content)
    setTimeout(attachClearCartHandlers, 500);
    setTimeout(attachClearCartHandlers, 1500);
})();
