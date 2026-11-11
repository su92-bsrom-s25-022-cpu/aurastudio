
// Auto WebP converter — replace .png/.jpg with .webp for existing WebP files
window.toWebP = function(imagePath) {
    if (!imagePath) return imagePath;
    if (imagePath.match(/\.(png|jpg|jpeg)$/i)) {
        return imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    }
    return imagePath;
};

document.addEventListener("DOMContentLoaded", function () {

    // ✅ Mobile Menu
    const menuBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("navMenu");

    if (menuBtn && navMenu) {

        menuBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            navMenu.classList.toggle("active");
        });

        navMenu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navMenu.classList.remove("active");
            });
        });

        document.addEventListener("click", function (e) {
            if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                navMenu.classList.remove("active");
            }
        });

    }

    // ✅ Search Toggle
    const searchToggle = document.getElementById("searchToggle");
    const searchBar = document.getElementById("searchBar");

    if (searchToggle && searchBar) {
        searchToggle.addEventListener("click", function (e) {
            e.preventDefault();
            searchBar.classList.toggle("active");
        });
    }

});

document.addEventListener("DOMContentLoaded", function () {
    var slider = document.querySelector(".hero-slider");
    var slides = document.querySelectorAll(".hero-slide");
    var prevBtn = document.querySelector(".hero-prev");
    var nextBtn = document.querySelector(".hero-next");
    var dotsWrap = document.querySelector(".hero-dots");

    if (!slider || !slides.length) return;

    var currentIndex = 0;
    var autoSlide;
    var startX = 0;
    var endX = 0;

    if (dotsWrap) {
        dotsWrap.innerHTML = "";
        slides.forEach(function (_, index) {
            var dot = document.createElement("button");
            dot.type = "button";
            dot.className = "hero-dot" + (index === 0 ? " active" : "");
            dot.addEventListener("click", function () {
                goToSlide(index);
                resetAutoSlide();
            });
            dotsWrap.appendChild(dot);
        });
    }

    function updateDots() {
        if (!dotsWrap) return;
        var dots = dotsWrap.querySelectorAll(".hero-dot");
        dots.forEach(function (dot, index) {
            if (index === currentIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    function goToSlide(index) {
        slides.forEach(function (slide, i) {
            if (i === index) {
                slide.classList.add("active");
            } else {
                slide.classList.remove("active");
            }
        });
        currentIndex = index;
        updateDots();
    }

    function nextSlide() {
        var nextIndex = currentIndex + 1;
        if (nextIndex >= slides.length) nextIndex = 0;
        goToSlide(nextIndex);
    }

    function prevSlide() {
        var prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = slides.length - 1;
        goToSlide(prevIndex);
    }

    function startAutoSlide() {
        autoSlide = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlide);
        startAutoSlide();
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", function () {
            nextSlide();
            resetAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", function () {
            prevSlide();
            resetAutoSlide();
        });
    }

    slider.addEventListener("touchstart", function (e) {
        startX = e.changedTouches[0].clientX;
    }, { passive: true });

    slider.addEventListener("touchend", function (e) {
        endX = e.changedTouches[0].clientX;
        var diff = startX - endX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            resetAutoSlide();
        }
    }, { passive: true });

    goToSlide(0);
    startAutoSlide();
});

// ===== DYNAMIC CATEGORIES LOADER =====
document.addEventListener("DOMContentLoaded", function () {
    const categoriesGrid = document.getElementById("categoriesGrid");

    if (!categoriesGrid) return;

    const API_URL = window.location.origin;

    fetch(API_URL + "/api/categories")
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            const categories = Array.isArray(data)
                ? data
                : Array.isArray(data.categories)
                    ? data.categories
                    : Array.isArray(data.data)
                        ? data.data
                        : [];

            if (!categories.length) {
                categoriesGrid.innerHTML = "<p>No categories found.</p>";
                return;
            }

            let html = "";

            categories.forEach(function (cat) {
                if (cat.isActive === false) return;

                const imageUrl = cat.image
                    ? (cat.image.startsWith("http") ? cat.image : API_URL + cat.image)
                    : API_URL + "/images/placeholder.jpg";

                html += '<a href="products.html?category=' + (cat.slug || cat._id) + '" class="category-card" style="text-decoration:none;">'
                    + '<div class="category-image" style="width:100%; aspect-ratio:1/1; overflow:hidden; border-radius:12px;">'
                    + '<img src="' + imageUrl + '" alt="' + (cat.name || '') + '" style="width:100%; height:100%; object-fit:cover;" onerror="this.src=\'' + API_URL + '/images/placeholder.jpg\'">'
                    + '</div>'
                    + '<h3 style="text-align:center; margin-top:12px; font-size:16px; color:#2c3e50; font-weight:600;">' + (cat.name || '') + '</h3>'
                    + '</a>';
            });

            categoriesGrid.innerHTML = html || "<p>No active categories found.</p>";
        })
        .catch(function (err) {
            console.error("Categories load error:", err);
            categoriesGrid.innerHTML = "<p>Failed to load categories.</p>";
        });
});
// ===== END DYNAMIC CATEGORIES =====

// ===== CATEGORY LOADER WITH DESCRIPTION =====
(function() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return;

    const API = window.location.origin;

    fetch(API + "/api/categories")
        .then(r => r.json())
        .then(cats => {
            if (!cats || !cats.length) {
                grid.innerHTML = "<p>No categories available.</p>";
                return;
            }

            grid.innerHTML = cats
                .filter(c => c.isActive)
                .map(c => `
                    <a href="products.html?category=${c.slug}" class="category-card">
                        <div class="category-image">
                            <img src="${API}${c.image}" alt="${c.name}" onerror="this.style.display='none'">
                        </div>
                        <h3>${c.name}</h3>
                        <p class="category-desc">${c.description || 'Explore our collection'}</p>
                    </a>
                `).join("");
        })
        .catch(e => {
            console.error("Category error:", e);
            grid.innerHTML = "<p>Failed to load categories.</p>";
        });
})();
// ===== END CATEGORY LOADER =====



