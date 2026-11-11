(function() {
    'use strict';

    // ===== USER CART SYNC =====
    // Save cart with user's email key
    function getUserCartKey() {
        var userData = JSON.parse(localStorage.getItem('userData') || 'null');
        if (userData && userData.email) {
            return 'cart_' + userData.email.replace(/[^a-zA-Z0-9]/g, '_');
        }
        return 'cart';
    }

    // Sync cart on login
    function syncCartOnLogin() {
        var token = localStorage.getItem('userToken');
        var userData = JSON.parse(localStorage.getItem('userData') || 'null');
        if (!token || !userData) return;

        var userCartKey = getUserCartKey();
        var currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
        var savedUserCart = JSON.parse(localStorage.getItem(userCartKey) || '[]');

        // Merge: if current cart has items, merge with saved user cart
        if (currentCart.length > 0 && savedUserCart.length > 0) {
            // Merge both carts (avoid duplicates)
            var merged = savedUserCart.slice();
            currentCart.forEach(function(item) {
                var exists = merged.find(function(m) {
                    return (m.id === item.id || m.productId === item.productId) &&
                           m.size === item.size && m.color === item.color;
                });
                if (!exists) {
                    merged.push(item);
                }
            });
            localStorage.setItem('cart', JSON.stringify(merged));
            localStorage.setItem(userCartKey, JSON.stringify(merged));
        } else if (savedUserCart.length > 0) {
            // User has saved cart, use it
            localStorage.setItem('cart', JSON.stringify(savedUserCart));
        } else if (currentCart.length > 0) {
            // Save current cart to user key
            localStorage.setItem(userCartKey, JSON.stringify(currentCart));
        }

        updateCartCount();
    }

    // Save cart whenever it changes
    function watchCart() {
        var token = localStorage.getItem('userToken');
        if (!token) return;

        var userCartKey = getUserCartKey();

        // Override localStorage.setItem to sync cart
        var originalSetItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function(key, value) {
            originalSetItem(key, value);

            // When main cart changes, save to user-specific key too
            if (key === 'cart' && userCartKey !== 'cart') {
                originalSetItem(userCartKey, value);
            }
        };
    }

    // Update cart count badge on all pages
    function updateCartCount() {
        var cart = JSON.parse(localStorage.getItem('cart') || '[]');
        var count = cart.reduce(function(sum, item) {
            return sum + (parseInt(item.quantity) || 1);
        }, 0);

        document.querySelectorAll('.cart-count, #cartCount').forEach(function(el) {
            el.textContent = count;
            if (count > 0) {
                el.style.display = 'inline-flex';
            }
        });
    }

    // ===== HEADER AUTH BUTTON =====
    function initUserAuth() {
        var headerIcons = document.querySelector('.header-icons');
        if (!headerIcons) return;

        var token = localStorage.getItem('userToken');
        var userData = JSON.parse(localStorage.getItem('userData') || 'null');

        // Remove existing auth button
        var existing = headerIcons.querySelector('.user-auth-btn');
        if (existing) existing.remove();

        var authBtn = document.createElement('a');
        authBtn.className = 'user-auth-btn';
        authBtn.style.cssText = 'color:#01411C;font-size:22px;text-decoration:none;cursor:pointer;';

        if (token && userData) {
            authBtn.href = 'profile.html';
            authBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
            authBtn.title = (userData.name || 'My Account') + ' - My Profile';

            // Sync cart on page load
            syncCartOnLogin();
            watchCart();
        } else {
            authBtn.href = 'login.html';
            authBtn.innerHTML = '<i class="fas fa-user"></i>';
            authBtn.title = 'Login / Sign Up';
        }

        var cartIcon = headerIcons.querySelector('.cart-icon, [href*="cart"]');
        if (cartIcon) {
            headerIcons.insertBefore(authBtn, cartIcon);
        } else {
            headerIcons.appendChild(authBtn);
        }

        // Update cart count
        updateCartCount();
    }

    // Logout
    window.logoutUser = function() {
        // Save cart to user key before logout
        var userCartKey = getUserCartKey();
        var cart = localStorage.getItem('cart');
        if (cart && userCartKey !== 'cart') {
            localStorage.setItem(userCartKey, cart);
        }

        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('cart'); // Clear current cart
        window.location.href = 'login.html';
    };

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUserAuth);
    } else {
        initUserAuth();
    }

    // Also update cart count periodically
    setInterval(updateCartCount, 2000);
})();
