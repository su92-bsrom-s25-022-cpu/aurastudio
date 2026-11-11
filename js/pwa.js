// Aura Studio - PWA Setup
(function() {
    'use strict';

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(reg) {
                    console.log('PWA: Service Worker registered', reg.scope);
                })
                .catch(function(err) {
                    console.log('PWA: SW registration failed', err);
                });
        });
    }

    // Install Prompt Handler
    let deferredPrompt;
    let installBtn;

    // Create Install Button
    function createInstallButton() {
        if (document.getElementById('pwa-install-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'pwa-install-btn';
        btn.innerHTML =
            '<div class="pwa-banner">' +
                '<div class="pwa-banner-content">' +
                    '<img src="/image/logo.png" alt="Aura Studio" class="pwa-icon">' +
                    '<div class="pwa-text">' +
                        '<strong>Install Aura Studio App</strong>' +
                        '<span>Get the app for faster access & offline shopping!</span>' +
                    '</div>' +
                '</div>' +
                '<div class="pwa-buttons">' +
                    '<button class="pwa-btn-install">Install</button>' +
                    '<button class="pwa-btn-close">×</button>' +
                '</div>' +
            '</div>';

        // Styles
        const style = document.createElement('style');
        style.textContent =
            '.pwa-banner {' +
                'position: fixed;' +
                'bottom: 0;' +
                'left: 0;' +
                'right: 0;' +
                'background: linear-gradient(135deg, #c9a227, #d4af37);' +
                'color: #fff;' +
                'padding: 12px 16px;' +
                'display: flex;' +
                'align-items: center;' +
                'justify-content: space-between;' +
                'gap: 10px;' +
                'z-index: 9999;' +
                'box-shadow: 0 -4px 20px rgba(0,0,0,0.2);' +
                'animation: pwaSlideUp 0.4s ease;' +
                'font-family: Poppins, sans-serif;' +
            '}' +
            '@keyframes pwaSlideUp {' +
                'from { transform: translateY(100%); }' +
                'to { transform: translateY(0); }' +
            '}' +
            '.pwa-banner-content {' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 10px;' +
                'flex: 1;' +
                'min-width: 0;' +
            '}' +
            '.pwa-icon {' +
                'width: 40px;' +
                'height: 40px;' +
                'border-radius: 8px;' +
                'background: white;' +
                'padding: 4px;' +
                'flex-shrink: 0;' +
            '}' +
            '.pwa-text {' +
                'display: flex;' +
                'flex-direction: column;' +
                'min-width: 0;' +
            '}' +
            '.pwa-text strong {' +
                'font-size: 13px;' +
                'display: block;' +
                'white-space: nowrap;' +
                'overflow: hidden;' +
                'text-overflow: ellipsis;' +
            '}' +
            '.pwa-text span {' +
                'font-size: 11px;' +
                'opacity: 0.9;' +
                'display: block;' +
                'white-space: nowrap;' +
                'overflow: hidden;' +
                'text-overflow: ellipsis;' +
            '}' +
            '.pwa-buttons {' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 8px;' +
                'flex-shrink: 0;' +
            '}' +
            '.pwa-btn-install {' +
                'background: white;' +
                'color: #c9a227;' +
                'border: none;' +
                'padding: 8px 20px;' +
                'border-radius: 20px;' +
                'font-weight: 700;' +
                'font-size: 13px;' +
                'cursor: pointer;' +
                'white-space: nowrap;' +
            '}' +
            '.pwa-btn-install:hover {' +
                'background: #f5f5f5;' +
            '}' +
            '.pwa-btn-close {' +
                'background: rgba(255,255,255,0.2);' +
                'color: white;' +
                'border: none;' +
                'width: 30px;' +
                'height: 30px;' +
                'border-radius: 50%;' +
                'font-size: 18px;' +
                'cursor: pointer;' +
                'display: flex;' +
                'align-items: center;' +
                'justify-content: center;' +
                'line-height: 1;' +
            '}' +
            '.pwa-btn-close:hover {' +
                'background: rgba(255,255,255,0.3);' +
            '}' +
            '@media (max-width: 480px) {' +
                '.pwa-banner { padding: 10px 12px; }' +
                '.pwa-icon { width: 34px; height: 34px; }' +
                '.pwa-text strong { font-size: 12px; }' +
                '.pwa-text span { font-size: 10px; }' +
                '.pwa-btn-install { padding: 6px 16px; font-size: 12px; }' +
                '.whatsapp-float { bottom: 90px !important; }' +
            '}';

        document.head.appendChild(style);
        document.body.appendChild(btn);
        installBtn = btn;

        // Button events
        const installBtnEl = btn.querySelector('.pwa-btn-install');
        const closeBtnEl = btn.querySelector('.pwa-btn-close');

        installBtnEl.addEventListener('click', installApp);
        closeBtnEl.addEventListener('click', function() {
            btn.style.display = 'none';
            localStorage.setItem('pwaBannerClosed', Date.now());
        });
    }

    // Install app
    function installApp() {
        if (!deferredPrompt) {
            alert('App installation not available. Please use Chrome browser and try again.');
            return;
        }

        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA: User accepted');
                if (installBtn) installBtn.style.display = 'none';
            } else {
                console.log('PWA: User dismissed');
            }
            deferredPrompt = null;
        });
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        console.log('PWA: Install prompt available');

        // Check if banner was recently closed (within 7 days)
        const closedAt = localStorage.getItem('pwaBannerClosed');
        if (closedAt && (Date.now() - parseInt(closedAt)) < 7 * 24 * 60 * 60 * 1000) {
            return;
        }

        // Show banner after 3 seconds
        setTimeout(createInstallButton, 3000);
    });

    // Detect if already installed
    window.addEventListener('appinstalled', function() {
        console.log('PWA: App installed successfully');
        if (installBtn) installBtn.style.display = 'none';
    });

    // Detect standalone mode (app already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA: Running as installed app');
        document.body.classList.add('pwa-installed');
    }
})();
