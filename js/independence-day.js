(function() {
    'use strict';

    // Only add elements on index page
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (currentPage !== 'index.html' && currentPage !== '') return;

    function addIndependenceDayElements() {
        // ADD TOP BANNER (announcement bar)
        if (!document.querySelector('.independence-banner')) {
            const banner = document.createElement('div');
            banner.className = 'independence-banner';
            banner.innerHTML =
                '<span class="flag-emoji">🇵🇰</span>' +
                'AZADI MUBARAK! Celebrating 14th August - Special Independence Day Offers' +
                '<span class="flag-emoji">🇵🇰</span>';

            document.body.insertBefore(banner, document.body.firstChild);
        }

        // ADD INDEPENDENCE DAY HERO SECTION
        if (!document.querySelector('.independence-hero')) {
            const header = document.querySelector('.header');
            if (header) {
                const hero = document.createElement('section');
                hero.className = 'independence-hero';
                hero.innerHTML =
                    '<div class="container">' +
                        '<div class="hero-date">🇵🇰 14 AUGUST 1947 🇵🇰</div>' +
                        '<h1 class="hero-title">Azadi Mubarak Pakistan!</h1>' +
                        '<div class="hero-subtitle">Independence Day Special Collection</div>' +
                        '<p class="hero-tagline">Celebrating 78 Years of Freedom - Shop our exclusive Green & White collection with special discounts!</p>' +
                        '<a href="products.html" class="btn-shop-now">Shop Independence Day Sale →</a>' +
                    '</div>';

                header.insertAdjacentElement('afterend', hero);

                // Add flag strip below
                const flagStrip = document.createElement('div');
                flagStrip.className = 'flag-strip';
                flagStrip.innerHTML = '<div class="white-part"></div><div class="green-part"></div>';
                hero.insertAdjacentElement('afterend', flagStrip);
            }
        }

        // ADD SPECIAL OFFER SECTION WITH COUNTDOWN
        if (!document.querySelector('.pak-special-offer')) {
            const flagStrip = document.querySelector('.flag-strip');
            if (flagStrip) {
                const specialOffer = document.createElement('section');
                specialOffer.className = 'pak-special-offer';
                specialOffer.innerHTML =
                    '<div class="offer-content">' +
                        '<div class="offer-tag">🎉 Limited Time Offer</div>' +
                        '<h2>Independence Day Mega Sale</h2>' +
                        '<div class="discount-text">UP TO 30% OFF</div>' +
                        '<p>On All Suits, Jewelry & Pouches - Celebrate Pakistan\'s Freedom in Style!</p>' +
                        '<div class="countdown-container">' +
                            '<div class="countdown-title">Sale Ends In</div>' +
                            '<div class="countdown-timer">' +
                                '<div class="countdown-item">' +
                                    '<span class="number" id="pakDays">0</span>' +
                                    '<span class="label">Days</span>' +
                                '</div>' +
                                '<div class="countdown-item">' +
                                    '<span class="number" id="pakHours">0</span>' +
                                    '<span class="label">Hours</span>' +
                                '</div>' +
                                '<div class="countdown-item">' +
                                    '<span class="number" id="pakMins">0</span>' +
                                    '<span class="label">Mins</span>' +
                                '</div>' +
                                '<div class="countdown-item">' +
                                    '<span class="number" id="pakSecs">0</span>' +
                                    '<span class="label">Secs</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                flagStrip.insertAdjacentElement('afterend', specialOffer);
            }
        }

        // ADD INDEPENDENCE MESSAGE (near footer)
        if (!document.querySelector('.independence-message')) {
            const footer = document.querySelector('footer') || document.querySelector('.footer');
            if (footer) {
                const message = document.createElement('section');
                message.className = 'independence-message';
                message.innerHTML =
                    '<h3>🇵🇰 Long Live Pakistan 🇵🇰</h3>' +
                    '<p>Pakistan Zindabad! On this special occasion of 14th August, we thank all Pakistanis for their trust and support. Wishing you a joyful Independence Day filled with pride, prosperity, and unity.</p>';

                footer.insertAdjacentElement('beforebegin', message);
            }
        }
    }

    // COUNTDOWN TIMER (to end of August 14)
    function updateCountdown() {
        const now = new Date();
        const currentYear = now.getFullYear();

        // Target: August 15, 2026 at midnight (end of August 14)
        let targetDate = new Date(currentYear, 7, 15, 0, 0, 0); // Month 7 = August

        // If we're past August 15 this year, target next year
        if (now > targetDate) {
            targetDate = new Date(currentYear + 1, 7, 15, 0, 0, 0);
        }

        const diff = targetDate - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('pakDays');
        const hoursEl = document.getElementById('pakHours');
        const minsEl = document.getElementById('pakMins');
        const secsEl = document.getElementById('pakSecs');

        if (daysEl) daysEl.textContent = days < 0 ? 0 : days;
        if (hoursEl) hoursEl.textContent = hours < 0 ? 0 : hours;
        if (minsEl) minsEl.textContent = minutes < 0 ? 0 : minutes;
        if (secsEl) secsEl.textContent = seconds < 0 ? 0 : seconds;
    }

    // Initialize
    function init() {
        addIndependenceDayElements();
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
