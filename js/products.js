
// ===================================
// products.js - Complete Fixed Version
// ===================================

const API_BASE_URL = '/api';

// Global variables
let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentSearch = '';
let currentFeatured = false;
let currentNewArrivals = false;
let currentBestSeller = false;
let allProducts = [];

// ===================================
// PAGE INITIALIZATION
// ===================================
// Canonical Tag Fix - Query URLs ke liye
(function() {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        // Hamesha base URL set karo without query string
        canonical.setAttribute(
            'href', 
            'https://www.aurastudiopk.com/products.html'
        );
    }
})();



document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Products page loaded');
    initializePage();
});

async function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);

    currentCategory = urlParams.get('category') || '';
    currentSearch = urlParams.get('search') || '';
    currentFeatured = urlParams.get('featured') === 'true';
    currentNewArrivals = urlParams.get('newArrivals') === 'true';
    currentBestSeller = urlParams.get('bestSeller') === 'true';

    console.log('🔍 URL Params:', {
        category: currentCategory,
        search: currentSearch,
        featured: currentFeatured,
        newArrivals: currentNewArrivals,
        bestSeller: currentBestSeller
    });

    updatePageContext();

    await loadCategories();
    await loadProducts();
    setupFilters();
}

function updatePageContext() {
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const searchInput = document.querySelector('input[name="search"]');

    if (searchInput && currentSearch) {
        searchInput.value = currentSearch;
    }

    if (currentFeatured) {
        if (pageTitle) pageTitle.textContent = 'Featured Products';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Featured';
    } else if (currentNewArrivals) {
        if (pageTitle) pageTitle.textContent = 'New Arrivals';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'New Arrivals';
    } else if (currentBestSeller) {
        if (pageTitle) pageTitle.textContent = 'Best Sellers';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Best Sellers';
    } else if (currentCategory) {
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Category';
    } else {
        if (pageTitle) pageTitle.textContent = 'Our Products';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Shop';
    }
}

// ===================================
// LOAD CATEGORIES
// ===================================

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();

        if (data.success || data.categories) {
            const categories = data.categories || data;
            console.log('✅ Categories loaded:', categories.length);
            
            // Populate category filter if exists
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat._id;
                    option.textContent = cat.name;
                    if (cat._id === currentCategory) {
                        option.selected = true;
                    }
                    categoryFilter.appendChild(option);
                });
            }

            // Populate category radios if exists
            const categoryRadios = document.querySelectorAll('input[name="category"]');
            if (categoryRadios.length > 0 && currentCategory) {
                categoryRadios.forEach(radio => {
                    if (radio.value === currentCategory) {
                        radio.checked = true;
                    }
                });
            }
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
    }
}

// ===================================
// LOAD PRODUCTS
// ===================================

async function loadProducts() {
    try {
        showLoading(true);

        let url = `${API_BASE_URL}/products?page=${currentPage}&limit=100`;

        if (currentCategory) {
            url += `&category=${encodeURIComponent(currentCategory)}`;
        }

        if (currentSearch) {
            url += `&search=${encodeURIComponent(currentSearch)}`;
        }

        if (currentFeatured) {
            url += `&featured=true`;
        }

        if (currentNewArrivals) {
            url += `&newArrivals=true`;
        }

        if (currentBestSeller) {
            url += `&bestSeller=true`;
        }

        console.log('🔍 Fetching products from:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('📦 API Response:', data);

        if (data.success || data.products) {
            allProducts = data.products || [];
            // Shuffle products randomly
            for (let i = allProducts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
            }
            totalPages = data.pagination?.pages || data.pages || 1;

            console.log('✅ Products loaded:', allProducts.length);
            
            // Update product count badge
            updateProductCount();

            updateProductCount();
            displayProducts(allProducts);
            renderPagination();
        } else {
            showError('Failed to load products');
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showError('Error loading products. Please try again.');
    } finally {
        showLoading(false);
    }
}

// ===================================
// ✅ GET IMAGE URL - FIXED 

function getImageUrl(product) {
    const placeholder = "/images/poster1.webp";

    if (!product.images || product.images.length === 0) {
        return placeholder;
    }

    let imageName = product.images[0];

    if (!imageName) return placeholder;

    

    let baseName = imageName.replace(/.(png|jpg|jpeg|webp)$/i, "");
    return "/uploads/products/" + baseName + "-small.webp";
}
// ===================================
// DISPLAY PRODUCTS
// ===================================

function displayProducts(products) {
    const container = document.getElementById('products-container') || 
                      document.getElementById('productsGrid') ||
                      document.querySelector('.products-grid');

    if (!container) {
        console.error('❌ Products container not found!');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <p style="font-size: 18px; color: #666;">No products found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const imageUrl = getImageUrl(product);
        const price = formatPrice(product.price);
        const salePrice = product.salePrice ? formatPrice(product.salePrice) : null;
        const discount = calculateDiscount(product.price, product.salePrice);

        return `
            <div class="product-card" data-id="${product._id}">
                <a href="product-detail.html?id=${product._id}" class="product-link">
                    <div class="product-image-wrapper">
                        <img loading="lazy" decoding="async" src="${imageUrl}" data-orig="${product.images[0]}" onerror="if(this.dataset.step==='2'){this.src='/images/poster1.webp';return;}if(this.dataset.step==='1'){this.dataset.step='2';this.src='/uploads/products/'+encodeURIComponent(this.dataset.orig);return;}this.dataset.step='1';var b=this.dataset.orig.replace(/\.(png|jpg|jpeg|webp)$/i,'');this.src='/uploads/products/'+b+'.webp';" 
                            alt="${escapeHtml(product.name)}" 
                            class="product-image"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='/image/placeholder.png';"
                        >
                        ${discount ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
                        ${product.isNewArrival ? '<span class="new-badge">New</span>' : ''}
                    </div>
                    
                    <div class="product-info">
                        <h3 class="product-name">${escapeHtml(product.name)}</h3>
                        
                        ${product.category?.name ? `
                            <p class="product-category">${escapeHtml(product.category.name)}</p>
                        ` : ''}
                        
                        <div class="product-price">
                            ${salePrice && salePrice !== price ? `
                                <span class="sale-price">Rs. ${salePrice}</span>
                                <span class="original-price" style="font-size:12px;color:#999;text-decoration:line-through;margin-left:5px;">Rs. ${price}</span>
                            ` : `
                                <span class="price">Rs. ${price}</span>
                            `}
                        </div>
                    </div>
                </a>
                
                <button class="add-to-cart-btn" onclick="event.preventDefault(); addToCart('${product._id}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `;
    }).join('');

    console.log('✅ Products displayed:', products.length);
}

// ===================================
// HELPER FUNCTIONS
// ===================================

function formatPrice(price) {
    if (!price) return '0';
    return Number(price).toLocaleString('en-PK');
}

function calculateDiscount(originalPrice, salePrice) {
    if (!salePrice || salePrice >= originalPrice) return null;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// SETUP FILTERS
// ===================================

function setupFilters() {
    console.log('⚙️ Setting up filters...');

    // Category filter (dropdown)
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }

    // Category filter (radio buttons)
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    console.log('Category radios found:', categoryRadios.length);
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    });

    // Search
    const searchInput = document.getElementById('search-input') || document.getElementById('searchInput');
    const searchButton = document.getElementById('search-button') || document.getElementById('searchBtn');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    // Sort
    const sortSelect = document.getElementById('sort-select') || document.getElementById('sortBy');
    if (sortSelect) {
        console.log('Sort select found:', sortSelect.id);
        sortSelect.addEventListener('change', handleSort);
    }

    // Size checkboxes
    const sizeCheckboxes = document.querySelectorAll('input[name="size"]');
    console.log('Size checkboxes found:', sizeCheckboxes.length);
    sizeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleSizeFilter);
    });

    console.log('✅ Filters setup complete');
}

// ===================================
// FILTER HANDLERS
// ===================================

function handleSearch() {
    const searchInput = document.getElementById('search-input') || document.getElementById('searchInput');
    currentSearch = searchInput?.value.trim() || '';
    currentPage = 1;
    loadProducts();
}

function handleSort(e) {
    const sortValue = e.target.value;
    console.log('🔄 Sorting by:', sortValue);
    
    let sortedProducts = [...allProducts];
    
    switch(sortValue) {
        case 'price-low':
        case 'price_asc':
            sortedProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
            break;
        case 'price-high':
        case 'price_desc':
            sortedProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
            break;
        case 'name-az':
        case 'name_asc':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-za':
        case 'name_desc':
            sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'newest':
        case 'date_desc':
            sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        default:
            break;
    }
    
    displayProducts(sortedProducts);
}

function handleSizeFilter() {
    const sizeCheckboxes = document.querySelectorAll('input[name="size"]:checked');
    const selectedSizes = Array.from(sizeCheckboxes).map(cb => cb.value);
    
    console.log('📏 Selected sizes:', selectedSizes);
    
    if (selectedSizes.length === 0) {
        displayProducts(allProducts);
        return;
    }
    
    const filteredProducts = allProducts.filter(product => {
        if (!product.sizes || product.sizes.length === 0) return false;
        return product.sizes.some(size => selectedSizes.includes(size));
    });
    
    displayProducts(filteredProducts);
}

// ===================================
// PAGINATION
// ===================================

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button class="page-btn prev-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Prev
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="page-dots">...</span>`;
        }
    }

    // Next button
    html += `
        <button class="page-btn next-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// ADD TO CART
// ===================================

async function addToCart(productId) {
    console.log('🛒 Adding to cart:', productId);
    
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
            console.log('📦 Updated quantity:', existingItem.quantity);
        } else {
            // Find product in current products
            const product = allProducts.find(p => p._id === productId);
            
            if (product) {
                cart.push({
                    productId: productId,
                    name: product.name,
                    price: product.salePrice || product.price,
                    image: getImageUrl(product),
                    quantity: 1
                });
                console.log('✅ Product added to cart');
            } else {
                // Fetch from API
                const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                const data = await response.json();
                
                if (data.success || data.product) {
                    const prod = data.product || data;
                    cart.push({
                        productId: productId,
                        name: prod.name,
                        price: prod.salePrice || prod.price,
                        image: getImageUrl(prod),
                        quantity: 1
                    });
                }
            }
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification('Product added to cart!', 'success');
        
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showNotification('Failed to add product', 'error');
    }
}

// ===================================
// CART COUNT
// ===================================

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

// ===================================
// NOTIFICATIONS
// ===================================

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:10px;cursor:pointer;">&times;</button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #27ae60;' : ''}
        ${type === 'error' ? 'background: #e74c3c;' : ''}
        ${type === 'info' ? 'background: #3498db;' : ''}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===================================
// LOADING & ERROR
// ===================================

function showLoading(show) {
    const spinner = document.getElementById('loading-spinner') || document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
    
    const container = document.getElementById('products-container') || document.getElementById('productsGrid');
    if (container) {
        container.style.opacity = show ? '0.5' : '1';
    }
}

function showError(message) {
    const container = document.getElementById('products-container') || document.getElementById('productsGrid');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
                <p style="font-size: 18px; color: #666; margin-bottom: 20px;">${message}</p>
                <button onclick="loadProducts()" style="padding: 10px 30px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// ===================================
// INITIALIZE CART COUNT
// ===================================

updateCartCount();

// ===================================
// CSS ANIMATION (add to page)
// ===================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);


// ===== VIEW TOGGLE - GRID/LIST =====
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var viewBtns = document.querySelectorAll('.view-btn');
        var grid = document.getElementById('productsGrid');

        viewBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                // Active class
                viewBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');

                var view = this.getAttribute('data-view');
                console.log('View changed to:', view);

                if (view === 'list') {
                    // List view - 1 column horizontal
                    grid.style.cssText = 'display:flex !important; flex-direction:column !important; gap:15px !important;';
                    grid.querySelectorAll('.product-card').forEach(function(card) {
                        card.style.cssText = 'display:flex !important; flex-direction:row !important; width:100% !important; min-height:200px !important; border-radius:12px !important; overflow:hidden !important; box-shadow:0 2px 10px rgba(0,0,0,0.08) !important; background:white !important;';
                        
                        var link = card.querySelector('.product-link, a');
                        if(link) link.style.cssText = 'display:flex !important; flex-direction:row !important; flex:1 !important; text-decoration:none !important; color:inherit !important;';
                        
                        var img = card.querySelector('.product-image-wrapper');
                        if(img) img.style.cssText = 'width:200px !important; min-width:200px !important; height:200px !important; flex-shrink:0 !important; overflow:hidden !important; position:relative !important;';
                        
                        var imgEl = card.querySelector('.product-image-wrapper img');
                        if(imgEl) imgEl.style.cssText = 'position:absolute !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important; object-fit:cover !important; object-position:top center !important;';
                        
                        var info = card.querySelector('.product-info');
                        if(info) info.style.cssText = 'flex:1 !important; padding:20px !important; display:flex !important; flex-direction:column !important; justify-content:center !important;';
                        
                        var name = card.querySelector('.product-name');
                        if(name) name.style.cssText = 'font-size:18px !important; font-weight:600 !important; margin-bottom:8px !important; -webkit-line-clamp:2 !important;';
                        
                        var cat = card.querySelector('.product-category');
                        if(cat) cat.style.cssText = 'font-size:13px !important; color:#999 !important; margin-bottom:10px !important;';
                        
                        var price = card.querySelector('.product-price');
                        if(price) price.style.cssText = 'margin-bottom:15px !important;';
                        
                        var btn = card.querySelector('.add-to-cart-btn');
                        if(btn) btn.style.cssText = 'width:200px !important; padding:10px !important; align-self:flex-end !important; margin-top:auto !important; border-radius:8px !important;';
                    });
                } else {
                    // Grid view - 2 columns
                    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                    grid.querySelectorAll('.product-card').forEach(function(card) {
                        card.style.cssText = 'display:flex !important; flex-direction:column !important;';
                        var link = card.querySelector('.product-link, a');
                        if(link) link.style.display = 'flex';
                        var img = card.querySelector('.product-image-wrapper');
                        if(img) img.style.cssText = 'width:100% !important; height:350px !important;';
                        var info = card.querySelector('.product-info');
                        if(info) info.style.cssText = 'padding:15px !important;';
                        var btn = card.querySelector('.add-to-cart-btn');
                        if(btn) btn.style.cssText = '';
                    });
                }
            });
        });
        console.log('✅ View toggle initialized, buttons found:', viewBtns.length);
    }, 2000);
});


// ============ PRODUCT COUNT UPDATE ============
function updateProductCount() {
    const countElements = document.querySelectorAll('.product-count, #productCount, [data-product-count]');
    const filteredCount = typeof filteredProducts !== 'undefined' ? filteredProducts.length : allProducts.length;
    const totalCount = allProducts.length;
    
    countElements.forEach(el => {
        el.textContent = filteredCount;
    });
    
    // Also update any "Showing X of Y" text
    const showingElements = document.querySelectorAll('.showing-count, #showingCount');
    showingElements.forEach(el => {
        el.textContent = `Showing ${filteredCount} of ${totalCount} products`;
    });
    
    // Update page title count if exists
    const titleCount = document.querySelector('.collection-count, .results-count');
    if (titleCount) {
        titleCount.textContent = `(${filteredCount})`;
    }
    
    console.log('🔢 Product count updated:', filteredCount, 'of', totalCount);
}

