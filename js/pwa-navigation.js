(function() {
    'use strict';

    // Only add bottom nav if app is installed (standalone mode)
    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.body.classList.contains('pwa-installed');
    }

    function addBottomNav() {
        // Only for standalone/PWA mode
        if (!isStandalone()) return;

        if (document.querySelector('.app-bottom-nav')) return;

        const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

        const isHome = ['index.html', ''].includes(currentPage);
        const isShop = currentPage === 'products.html';
        const isCart = currentPage === 'cart.html';
        const isAccount = ['about.html', 'contact.html'].includes(currentPage);

        const nav = document.createElement('nav');
        nav.className = 'app-bottom-nav';
        nav.innerHTML =
            '<a href="index.html" class="app-nav-item' + (isHome ? ' active' : '') + '">' +
                '<i class="fas fa-home"></i><span>Home</span></a>' +
            '<a href="products.html" class="app-nav-item' + (isShop ? ' active' : '') + '">' +
                '<i class="fas fa-th-large"></i><span>Shop</span></a>' +
            '<a href="cart.html" class="app-nav-item' + (isCart ? ' active' : '') + '">' +
                '<i class="fas fa-shopping-bag"></i><span>Cart</span></a>' +
            '<a href="about.html" class="app-nav-item' + (isAccount ? ' active' : '') + '">' +
                '<i class="fas fa-user"></i><span>Account</span></a>';

        document.body.appendChild(nav);
    }

    // Check on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBottomNav);
    } else {
        addBottomNav();
    }

    // Also add class to body if standalone
    if (isStandalone()) {
        document.body.classList.add('pwa-installed');
    }
})();
