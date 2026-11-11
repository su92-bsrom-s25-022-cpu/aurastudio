(function() {
    'use strict';

    function isLoggedIn() {
        return localStorage.getItem('userToken') && localStorage.getItem('userData');
    }

    function showLoginPrompt() {
        // Create beautiful login popup
        var overlay = document.createElement('div');
        overlay.id = 'loginPromptOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';

        overlay.innerHTML =
            '<div style="background:white;border-radius:20px;padding:40px 30px;max-width:400px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.3);">' +
                '<div style="width:70px;height:70px;background:rgba(1,65,28,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">' +
                    '<i class="fas fa-lock" style="font-size:30px;color:#01411C;"></i>' +
                '</div>' +
                '<h3 style="margin:0 0 10px;font-size:20px;color:#1a1a1a;font-family:Playfair Display,serif;">Login Required</h3>' +
                '<p style="color:#888;font-size:14px;margin:0 0 25px;line-height:1.6;">Please login or create an account to add items to your cart and place orders.</p>' +
                '<a href="login.html" style="display:block;padding:14px;background:#01411C;color:white;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:12px;">Login to Your Account</a>' +
                '<a href="signup.html" style="display:block;padding:14px;background:white;color:#01411C;border:2px solid #01411C;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:15px;">Create New Account</a>' +
                '<button onclick="document.getElementById(\'loginPromptOverlay\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:13px;padding:5px;">Continue Browsing</button>' +
            '</div>';

        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
    }

    // Override addToCart globally
    var originalAddToCart = window.addToCart;

    window.addToCartProtected = function() {
        if (!isLoggedIn()) {
            showLoginPrompt();
            return false;
        }
        // Call original if exists
        if (typeof originalAddToCart === 'function') {
            return originalAddToCart.apply(this, arguments);
        }
        return true;
    };

    // Intercept all Add to Cart clicks
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.add-to-cart-btn, [onclick*="addToCart"], button[onclick*="addPouchToCart"]');

        if (btn && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showLoginPrompt();
            return false;
        }
    }, true);

    // Protect cart page
    var currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();

    if (currentPage === 'cart.html' && !isLoggedIn()) {
        document.addEventListener('DOMContentLoaded', function() {
            var mainContent = document.querySelector('.cart-section, .cart-content, .container, main');
            if (mainContent) {
                mainContent.innerHTML =
                    '<div style="text-align:center;padding:80px 20px;max-width:500px;margin:0 auto;">' +
                        '<div style="width:80px;height:80px;background:rgba(1,65,28,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 25px;">' +
                            '<i class="fas fa-shopping-bag" style="font-size:35px;color:#01411C;"></i>' +
                        '</div>' +
                        '<h2 style="font-family:Playfair Display,serif;color:#1a1a1a;margin:0 0 12px;font-size:26px;">Login to View Cart</h2>' +
                        '<p style="color:#888;font-size:14px;margin:0 0 30px;line-height:1.6;">Please login or create an account to add items to cart and place orders.</p>' +
                        '<a href="login.html" style="display:inline-block;padding:14px 40px;background:#01411C;color:white;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:12px;">Login Now</a>' +
                        '<br><a href="signup.html" style="display:inline-block;margin-top:10px;color:#01411C;font-weight:600;text-decoration:none;font-size:14px;">Create Account</a>' +
                        '<br><a href="products.html" style="display:inline-block;margin-top:15px;color:#888;font-size:13px;text-decoration:none;"><i class="fas fa-arrow-left"></i> Continue Shopping</a>' +
                    '</div>';
            }
        });
    }

    // Protect checkout page
    if (currentPage === 'checkout.html' && !isLoggedIn()) {
        window.location.href = 'login.html';
    }

})();
