const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

let currentProduct = null;
let selectedSize = '';
let selectedColor = '';
let selectedColorCode = '#000000';

// ===== HELPERS =====
function getImageUrl(img) {
    if (!img) return '/images/placeholder.jpg';
    if (img.startsWith('http') || img.startsWith('/')) return img;
    return '/uploads/products/' + img;
}
function getCategoryName(cat) {
    if (!cat) return '';
    if (typeof cat === 'string') return cat;
    return cat.name || '';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    var productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) {
        document.getElementById('productLoader').innerHTML = '<p style="color:#e74c3c;">Product not found. <a href="products.html">Go back</a></p>';
        return;
    }
    loadProduct(productId);
    updateCartCount();
});

// ===== LOAD PRODUCT =====
async function loadProduct(productId) {
    try {
        var res = await fetch(API_BASE + '/products/' + productId);
        if (!res.ok) throw new Error('Product not found');
        var data = await res.json();
        currentProduct = data.product || data;
        displayProduct(currentProduct);
        loadRelatedProducts(currentProduct.category, currentProduct._id);
    } catch (error) {
        document.getElementById('productLoader').innerHTML =
            '<p style="color:#e74c3c;">Failed to load product. <a href="products.html">Go back</a></p>';
    }
}

// ===== DISPLAY PRODUCT =====
function displayProduct(product) {
    document.getElementById('productLoader').style.display = 'none';
    document.getElementById('productContent').style.display = 'grid';
    document.getElementById('productTabs').style.display = 'block';

    var catName = getCategoryName(product.category);
    
    // Hide Size Guide tab for Pouches and Jewelry
    setTimeout(function() {
        var sizingBtn = document.getElementById('sizingTabBtn');
        if (sizingBtn) {
            var lowerCat = (catName || '').toLowerCase();
            if (lowerCat.indexOf('pouch') !== -1 || lowerCat.indexOf('jewel') !== -1) {
                sizingBtn.style.display = 'none';
            } else {
                sizingBtn.style.display = '';
            }
        }
    }, 100);
    document.getElementById('productTitle').textContent = product.name || '';
    document.getElementById('productCategory').textContent = catName;
    document.getElementById('breadcrumbProduct').textContent = product.name || '';
    document.title = (product.name || 'Product') + ' - Aura Studio';

    // Price
    updatePriceDisplay(product.salePrice, product.price);

    // Images
    displayImages(product);

    // ✅ INVENTORY SYSTEM - Size + Color + Stock
    if (product.inventory && product.inventory.length > 0) {
        displayInventory(product.inventory);
    } else {
        // Old system fallback
        displayOldSizesColors(product);
        updateStockDisplay(product.stock);
    }

    // Meta
    document.getElementById('productSKU').textContent = product._id ? product._id.slice(-8).toUpperCase() : '-';
    document.getElementById('productFabric').textContent = product.fabric || '-';
    document.getElementById('productCategoryMeta').textContent = catName || '-';

    // Description
    var descEl = document.getElementById('fullDescription');
    if (descEl) {
        descEl.innerHTML = product.description
            ? product.description.replace(/\n/g, '<br>')
            : 'No description available.';
    }
// ✅ Update OG tags dynamically
document.getElementById("og-title").setAttribute("content", product.name);
document.getElementById("og-desc").setAttribute("content", product.description ? product.description.substring(0,180) : "");
document.getElementById("og-image").setAttribute("content", window.location.origin + '/uploads/products/' + product.images[0]);
document.getElementById("og-url").setAttribute("content", window.location.href);
}

// ===== PRICE DISPLAY =====
function updatePriceDisplay(salePrice, price) {
    var container = document.getElementById('productPriceContainer');
    if (!container) return;

    if (salePrice && salePrice < price) {
        var discount = Math.round(((price - salePrice) / price) * 100);
        container.innerHTML =
            '<span class="current-price" id="productPrice">Rs. ' + salePrice.toLocaleString() + '</span>' +
            '<span style="text-decoration:line-through;color:#999;margin-left:10px;font-size:16px;">Rs. ' + price.toLocaleString() + '</span>' +
            '<span style="background:#e74c3c;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;margin-left:8px;font-weight:700;">-' + discount + '%</span>';
    } else {
        container.innerHTML = '<span class="current-price" id="productPrice">Rs. ' + (price || 0).toLocaleString() + '</span>';
    }
}

// ===== STOCK DISPLAY =====
function updateStockDisplay(stock) {
    var el = document.getElementById('stockStatus');
    if (!el) return;

    // Get total stock for reference
    var totalStock = 0;
    if (currentProduct && currentProduct.inventory) {
        totalStock = currentProduct.inventory.reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0);
    } else if (currentProduct) {
        totalStock = currentProduct.stock || 0;
    }

    if (stock > 0) {
        var stockText = '';
        if (selectedSize && selectedColor) {
            // Exact combo selected - show combo stock + total
            stockText = stock + ' available';
            if (stock <= 3) stockText = 'Only ' + stock + ' left!';
            stockText += ' <span style="color:#999;font-size:12px;">(Total stock: ' + totalStock + ')</span>';
        } else if (selectedSize) {
            // Only size selected
            stockText = stock + ' in this size';
            stockText += ' <span style="color:#999;font-size:12px;">(Total: ' + totalStock + ')</span>';
        } else {
            // Nothing selected
            stockText = 'Total ' + stock + ' in stock';
        }
        el.innerHTML = '<i class="fas fa-check-circle" style="color:#27ae60"></i> <span style="color:#27ae60;font-weight:600;">' + stockText + '</span>';
        document.getElementById('addToCartBtn').disabled = false;
        document.getElementById('buyNowBtn').disabled = false;
    } else {
        var outMsg = 'Out of Stock';
        if (selectedSize && selectedColor) {
            outMsg = 'This combination is out of stock';
        }
        outMsg += ' <span style="color:#999;font-size:12px;">(Total stock: ' + totalStock + ')</span>';
        el.innerHTML = '<i class="fas fa-times-circle" style="color:#e74c3c"></i> <span style="color:#e74c3c;font-weight:600;">' + outMsg + '</span>';
        document.getElementById('addToCartBtn').disabled = true;
        document.getElementById('buyNowBtn').disabled = true;
    }
}

// ===== IMAGES =====
function displayImages(product) {
    var mainImg = document.getElementById('mainImage');
    var thumbContainer = document.getElementById('thumbnailImages');
    if (!mainImg || !product.images || product.images.length === 0) return;

    mainImg.src = getImageUrl(product.images[0]);
    mainImg.alt = product.name;
    thumbContainer.innerHTML = '';

    product.images.forEach(function(img, i) {
        var thumb = document.createElement('img');
        thumb.src = getImageUrl(img);
        thumb.alt = product.name;
        if (i === 0) thumb.classList.add('active');
        thumb.onclick = function() {
            mainImg.src = getImageUrl(img);
            thumbContainer.querySelectorAll('img').forEach(function(t) { t.classList.remove('active'); });
            thumb.classList.add('active');
        };
        thumbContainer.appendChild(thumb);
    });
}

// ===== ✅ NEW INVENTORY DISPLAY =====
function displayInventory(inventory) {
    // Get unique sizes
    var sizes = [...new Set(inventory.map(function(i) { return i.size; }))];

    // Get unique colors
    var colorMap = {};
    inventory.forEach(function(i) {
        if (!colorMap[i.color]) {
            colorMap[i.color] = i.colorCode || '#cccccc';
        }
    });

    // Show size buttons
    var sizeGroup = document.getElementById('sizeGroup');
    var sizesContainer = document.getElementById('productSizes');
    var catName1 = (currentProduct.category && currentProduct.category.name || "").toLowerCase();
    var isPouch = catName1.indexOf("pouch") !== -1 || catName1.indexOf("jewel") !== -1;
    if (isPouch) {
        sizeGroup.style.display = "none";
        selectedSize = "STANDARD";
    } else {
        sizeGroup.style.display = "block";
    }
    sizesContainer.innerHTML = '';

    sizes.forEach(function(size) {
        // Check if this size has any stock
        var sizeStock = inventory
            .filter(function(i) { return i.size === size; })
            .reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0);

        var btn = document.createElement('button');
        btn.className = 'size-btn';
        btn.textContent = size;
        btn.setAttribute('data-size', size);

        if (sizeStock === 0) {
            btn.disabled = true;
            btn.style.cssText = 'opacity:0.4;cursor:not-allowed;text-decoration:line-through;';
            btn.title = 'Out of stock';
        }

        btn.onclick = function() {
            if (btn.disabled) return;
            document.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            selectedSize = size;

            // Update colors based on selected size
            updateColorsForSize(size, inventory);
        };

        sizesContainer.appendChild(btn);
    });

    // Show color buttons
    var colorGroup = document.getElementById('colorGroup');
    colorGroup.style.display = 'block';
    renderColorButtons(inventory, Object.keys(colorMap), colorMap, null);

    // Show total stock initially
    var totalStock = inventory.reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0);
    updateStockDisplay(totalStock);
}

// Update colors when size is selected
function updateColorsForSize(size, inventory) {
    var colorMap = {};
    inventory.forEach(function(i) {
        if (!colorMap[i.color]) colorMap[i.color] = i.colorCode || '#cccccc';
    });

    var allColors = Object.keys(colorMap);
    renderColorButtons(inventory, allColors, colorMap, size);

    // Reset color selection
    selectedColor = '';
    selectedColorCode = '#000000';

    // Reset quantity to 1
    var qtyInput = document.getElementById('quantity');
    if (qtyInput) { qtyInput.value = 1; qtyInput.max = 99; }

    // Update stock for this size (total of all colors in this size)
    var sizeStock = inventory
        .filter(function(i) { return i.size === size; })
        .reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0);
    updateStockDisplay(sizeStock);
}

function renderColorButtons(inventory, colors, colorMap, selectedSize) {
    var colorsContainer = document.getElementById('productColors');
    colorsContainer.innerHTML = '';

    colors.forEach(function(colorName) {
        var colorCode = colorMap[colorName] || '#cccccc';

        // Stock for this color (optionally filtered by size)
        var colorStock = inventory
            .filter(function(i) {
                return i.color === colorName && (selectedSize ? i.size === selectedSize : true);
            })
            .reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0);

        var btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.setAttribute('data-color', colorName);

        // Stock badge
        var stockBadge = colorStock > 0
            ? '<span style="font-size:10px;color:#999;display:block;">(' + colorStock + ' left)</span>'
            : '<span style="font-size:10px;color:#e74c3c;display:block;">(Out)</span>';

        btn.innerHTML =
            '<span class="color-circle" style="background:' + colorCode + ';width:24px;height:24px;border-radius:50%;display:inline-block;border:2px solid #ddd;vertical-align:middle;margin-right:6px;"></span>' +
            '<span>' + colorName + '</span>' +
            stockBadge;

        if (colorStock === 0) {
            btn.disabled = true;
            btn.style.cssText += 'opacity:0.4;cursor:not-allowed;';
            btn.title = 'Out of stock';
        }

        btn.onclick = function() {
            if (btn.disabled) return;
            document.querySelectorAll('.color-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            selectedColor = colorName;
            selectedColorCode = colorCode;

            // Update stock for exact size+color combo
            if (selectedSize) {
                var comboStock = inventory
                    .filter(function(i) { return i.size === selectedSize && i.color === colorName; })
                    .reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0);
                updateStockDisplay(comboStock);

                // Set max quantity to exact combo stock
                var qtyInput = document.getElementById('quantity');
                if (qtyInput) {
                    qtyInput.max = comboStock;
                    qtyInput.value = 1; // Reset to 1
                    if (comboStock === 0) qtyInput.value = 0;
                }

                // Disable/enable cart buttons
                var addBtn = document.getElementById('addToCartBtn');
                var buyBtn = document.getElementById('buyNowBtn');
                if (comboStock === 0) {
                    if (addBtn) addBtn.disabled = true;
                    if (buyBtn) buyBtn.disabled = true;
                } else {
                    if (addBtn) addBtn.disabled = false;
                    if (buyBtn) buyBtn.disabled = false;
                }
            }
        };

        colorsContainer.appendChild(btn);
    });
}

// ===== OLD SYSTEM FALLBACK =====
function displayOldSizesColors(product) {
    if (product.sizes && product.sizes.length > 0) {
        document.getElementById('sizeGroup').style.display = 'block';
        var sizesContainer = document.getElementById('productSizes');
        sizesContainer.innerHTML = '';
        product.sizes.forEach(function(size) {
            var btn = document.createElement('button');
            btn.className = 'size-btn';
            btn.textContent = size;
            btn.onclick = function() {
                document.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                selectedSize = size;
            };
            sizesContainer.appendChild(btn);
        });
    }

    if (product.colors && product.colors.length > 0) {
        document.getElementById('colorGroup').style.display = 'block';
        var colorsContainer = document.getElementById('productColors');
        colorsContainer.innerHTML = '';
        product.colors.forEach(function(color) {
            var colorName = typeof color === 'string' ? color : (color.name || '');
            var colorCode = typeof color === 'object' ? (color.code || '#ccc') : '#ccc';
            var btn = document.createElement('button');
            btn.className = 'color-btn';
            btn.innerHTML =
                '<span class="color-circle" style="background:' + colorCode + ';width:24px;height:24px;border-radius:50%;display:inline-block;border:2px solid #ddd;vertical-align:middle;margin-right:6px;"></span>' +
                colorName;
            btn.onclick = function() {
                document.querySelectorAll('.color-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                selectedColor = colorName;
                selectedColorCode = colorCode;
            };
            colorsContainer.appendChild(btn);
        });
    }
}

// ===== QUANTITY =====
function decreaseQty() {
    var qty = document.getElementById('quantity');
    var current = parseInt(qty.value) || 1;
    if (current > 1) qty.value = current - 1;
}

// Validate quantity when manually typed
function validateQtyInput() {
    var qty = document.getElementById('quantity');
    var availableStock = getAvailableStock();
    var val = parseInt(qty.value) || 1;

    if (!selectedSize) {
        qty.value = 1;
        return;
    }

    if (!selectedColor) {
        qty.value = 1;
        return;
    }

    if (availableStock <= 0) {
        qty.value = 0;
        return;
    }

    if (val < 1) qty.value = 1;
    if (val > availableStock) {
        qty.value = availableStock;
        showToast('Maximum ' + availableStock + ' available for ' + selectedSize + ' / ' + selectedColor, 'error');
    }
}

function increaseQty() {
    var qty = document.getElementById('quantity');
    var maxStock = getAvailableStock();

    var isPouchProd = currentProduct.category && currentProduct.category.name && (currentProduct.category.name.toLowerCase().indexOf("pouch") !== -1 || currentProduct.category.name.toLowerCase().indexOf("jewel") !== -1);
    if (!isPouchProd && !selectedSize) { showToast("Please select a size first!", "error"); return; }
    if (!selectedColor) { showToast('Please select a color first!', 'error'); return; }
    if (maxStock <= 0) { showToast('Out of stock!', 'error'); return; }

    var current = parseInt(qty.value) || 1;
    if (current < maxStock) {
        qty.value = current + 1;
    } else {
        showToast('Maximum ' + maxStock + ' available for ' + selectedSize + ' / ' + selectedColor + '!', 'error');
    }
}

function getAvailableStock() {
    if (!currentProduct) return 0;

    // Inventory system
    if (currentProduct.inventory && currentProduct.inventory.length > 0) {
        // Exact size + color combo stock
        if (selectedSize && selectedColor) {
            return currentProduct.inventory
                .filter(function(i) {
                    return String(i.size).trim() === String(selectedSize).trim() &&
                           String(i.color).trim().toLowerCase() === String(selectedColor).trim().toLowerCase();
                })
                .reduce(function(sum, i) {
                    return sum + (parseInt(i.quantity) || 0);
                }, 0);
        }

        // Only selected size stock
        if (selectedSize) {
            return currentProduct.inventory
                .filter(function(i) {
                    return String(i.size).trim() === String(selectedSize).trim();
                })
                .reduce(function(sum, i) {
                    return sum + (parseInt(i.quantity) || 0);
                }, 0);
        }

        return 0;
    }

    // Old system fallback
    return parseInt(currentProduct.stock) || 0;
}

// ===== ADD TO CART =====
function addToCart() {
    if (!currentProduct) return;

    if ((currentProduct.sizes && currentProduct.sizes.length > 0) ||
        (currentProduct.inventory && currentProduct.inventory.length > 0)) {
        if (!selectedSize) {
            showToast('Please select a size!', 'error');
            document.getElementById('sizeGroup').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    }

    if ((currentProduct.colors && currentProduct.colors.length > 0) ||
        (currentProduct.inventory && currentProduct.inventory.length > 0)) {
        if (!selectedColor) {
            showToast('Please select a color!', 'error');
            document.getElementById('colorGroup').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    }

    var availableStock = getAvailableStock();
    if (availableStock <= 0) {
        showToast('This combination is out of stock!', 'error');
        return;
    }

    var quantity = parseInt(document.getElementById('quantity').value) || 1;
    var price = currentProduct.salePrice && currentProduct.salePrice < currentProduct.price
        ? currentProduct.salePrice : currentProduct.price;

    var cartItem = {
        id: currentProduct._id,
        name: currentProduct.name,
        price: price,
        image: currentProduct.images && currentProduct.images.length > 0 ? getImageUrl(currentProduct.images[0]) : '',
        size: selectedSize,
        color: selectedColor,
        colorCode: selectedColorCode,
        quantity: quantity
    };

    var cart = JSON.parse(localStorage.getItem('cart') || '[]');

    var existingIndex = cart.findIndex(function(item) {
        return item.id === cartItem.id &&
               String(item.size || '').trim() === String(cartItem.size || '').trim() &&
               String(item.color || '').trim().toLowerCase() === String(cartItem.color || '').trim().toLowerCase();
    });

    var existingQty = existingIndex > -1 ? (parseInt(cart[existingIndex].quantity) || 0) : 0;
    var remainingStock = availableStock - existingQty;

    if (remainingStock <= 0) {
        showToast('Maximum stock already added for ' + selectedSize + ' / ' + selectedColor, 'error');
        return;
    }

    if (quantity > remainingStock) {
        showToast('Only ' + remainingStock + ' more available for ' + selectedSize + ' / ' + selectedColor, 'error');
        document.getElementById('quantity').value = remainingStock;
        return;
    }

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    var btn = document.getElementById('addToCartBtn');
    var original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
    btn.style.background = '#27ae60';
    setTimeout(function() {
        btn.innerHTML = original;
        btn.style.background = '';
    }, 2000);

    showToast('✅ Added to cart!', 'success');
}

// ===== BUY NOW =====
function buyNow() {
    addToCart();
    if (selectedSize || (!currentProduct.sizes || currentProduct.sizes.length === 0)) {
        if (selectedColor || (!currentProduct.colors || currentProduct.colors.length === 0)) {
            setTimeout(function() { window.location.href = 'checkout.html'; }, 300);
        }
    }
}

// ===== WHATSAPP INQUIRY =====
function whatsappInquiry() {
    var productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) return;

    var name = currentProduct ? currentProduct.name : 'Product';
    var price = currentProduct ? (currentProduct.salePrice || currentProduct.price) : '';
    var size = selectedSize ? ' | Size: ' + selectedSize : '';
    var color = selectedColor ? ' | Color: ' + selectedColor : '';
    var url = window.location.origin + '/share/product/' + productId;

    var msg = '🛍️ Interested in: ' + name + '\n💰 Price: Rs. ' + (price ? price.toLocaleString() : '') + size + color + '\n\n🔗 ' + url;
    window.open('https://wa.me/923214153059?text=' + encodeURIComponent(msg), '_blank');
}

// ===== TOAST =====
function showToast(msg, type) {
    var old = document.querySelector('.product-toast');
    if (old) old.remove();
    var div = document.createElement('div');
    div.className = 'product-toast';
    div.textContent = msg;
    div.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);padding:12px 25px;border-radius:25px;color:#fff;font-weight:600;font-size:14px;z-index:99999;box-shadow:0 5px 20px rgba(0,0,0,0.2);transition:all 0.3s;white-space:nowrap;background:' +
        (type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#2c3e50');
    document.body.appendChild(div);
    setTimeout(function() { div.remove(); }, 3000);
}

// ===== CART COUNT =====
function updateCartCount() {
    var cart = JSON.parse(localStorage.getItem('cart') || '[]');
    var total = cart.reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0);
    document.querySelectorAll('.cart-count').forEach(function(el) { el.textContent = total; });
}

// ===== RELATED PRODUCTS =====
async function loadRelatedProducts(category, currentId) {
    try {
        var catName = getCategoryName(category);
        var res = await fetch(API_BASE + '/products?category=' + encodeURIComponent(catName) + '&limit=8');
        var data = await res.json();
        var products = (data.products || data).filter(function(p) { return p._id !== currentId; });
        if (products.length === 0) return;

        var container = document.getElementById('relatedProducts');
        container.innerHTML = '';

        products.slice(0, 4).forEach(function(product) {
            var price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
            var image = product.images && product.images.length > 0 ? getImageUrl(product.images[0]) : '/images/placeholder.jpg';
            var totalStock = product.inventory
                ? product.inventory.reduce(function(s, i) { return s + (i.quantity || 0); }, 0)
                : (product.stock || 0);

            container.innerHTML +=
                '<div class="product-card">' +
                '<a href="product-detail.html?id=' + product._id + '">' +
                '<div class="product-image"><img loading="lazy" decoding="async" src="' + image + '" alt="' + product.name + '" loading="lazy"></div>' +
                '<div class="product-card-info" style="padding:12px;">' +
                '<h3 style="font-size:14px;margin-bottom:5px;">' + product.name + '</h3>' +
                '<p style="color:#c8a165;font-weight:700;">Rs. ' + price.toLocaleString() + '</p>' +
                (product.salePrice && product.salePrice < product.price
                    ? '<p style="text-decoration:line-through;color:#999;font-size:12px;">Rs. ' + product.price.toLocaleString() + '</p>' : '') +
                '<p style="font-size:11px;color:' + (totalStock > 0 ? '#27ae60' : '#e74c3c') + ';">' +
                (totalStock > 0 ? 'In Stock' : 'Out of Stock') + '</p>' +
                '</div></a></div>';
        });

        document.getElementById('relatedSection').style.display = 'block';
    } catch (e) {
        console.error('Related products error:', e);
    }
}

// ===== SHARE =====
window.shareProduct = function(platform) {
    var productId = new URLSearchParams(window.location.search).get('id');
    var shareUrl = productId
        ? window.location.origin + '/share/product/' + productId
        : window.location.href;
    var encoded = encodeURIComponent(shareUrl);

    var links = {
        facebook:  'https://www.facebook.com/sharer/sharer.php?u=' + encoded,
        twitter:   'https://twitter.com/intent/tweet?url=' + encoded,
        whatsapp:  'https://wa.me/?text=' + encoded,
        instagram: null,
        tiktok:    null,
        youtube:   null
    };

    if (platform === 'instagram' || platform === 'tiktok' || platform === 'youtube') {
        navigator.clipboard && navigator.clipboard.writeText(shareUrl);
        showToast('🔗 Link copied! Open ' + platform + ' to share', 'success');
        return;
    }

    if (links[platform]) window.open(links[platform], '_blank', 'width=700,height=500');
};

// ===== UNIVERSAL SHARE WITH REAL IMAGE =====
async function universalShare() {
    if (!currentProduct) return;

    var title = currentProduct.name || 'Aura Studio Product';
    var price = currentProduct.salePrice && currentProduct.salePrice < currentProduct.price
        ? currentProduct.salePrice : (currentProduct.price || 0);
    var category = currentProduct.category && currentProduct.category.name
        ? currentProduct.category.name : '';
    var fabric = currentProduct.fabric || '';
    var sizes = currentProduct.sizes && currentProduct.sizes.length
        ? currentProduct.sizes.join(', ') : '';

    var desc = (currentProduct.description || '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 250);

    var productUrl = window.location.origin + '/api/share/product/' + currentProduct._id;

    // Format caption - readable text
    var caption =
        '✨ ' + title + '\n' +
        '💰 Price: Rs. ' + Number(price).toLocaleString() + '\n' +
        (fabric ? '🧵 Fabric: ' + fabric + '\n' : '') +
        (category ? '📦 Category: ' + category + '\n' : '') +
        (sizes ? '📏 Sizes: ' + sizes + '\n' : '') +
        '\n' + desc + '\n\n' +
        '🛍️ Shop now: ' + productUrl + '\n\n' +
        '#AuraStudio #PakistaniSuits #LadiesFashion';

    var imageUrl = currentProduct.images && currentProduct.images.length > 0
        ? getImageUrl(currentProduct.images[0])
        : '';

    // === MOBILE: Native Share with Image File ===
    if (navigator.share) {
        try {
            // Try to fetch and attach image
            if (imageUrl && navigator.canShare) {
                try {
                    showToast('📷 Preparing image...', 'success');
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const ext = blob.type.includes('png') ? 'png' : 'jpg';
                    const fileName = (currentProduct.name || 'product')
                        .replace(/[^a-z0-9]/gi, '-')
                        .toLowerCase()
                        .substring(0, 30) + '.' + ext;
                    const file = new File([blob], fileName, { type: blob.type });

                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: title,
                            text: caption,
                            files: [file]
                        });
                        showToast('✅ Shared!', 'success');
                        return;
                    }
                } catch(e) {
                    console.log('Image share failed, fallback to text+url', e);
                }
            }

            // Fallback: text + url
            await navigator.share({
                title: title,
                text: caption,
                url: productUrl
            });
            showToast('✅ Shared!', 'success');
            return;
        } catch(err) {
            if (err.name !== 'AbortError') {
                console.error('Share error:', err);
            }
        }
    }

    // === DESKTOP: Open share modal ===
    openShareFallback(caption, imageUrl);
}

function openShareFallback(caption, imageUrl) {
    var modal = document.getElementById('shareFallbackModal');
    if (!modal) {
        createShareModal();
        modal = document.getElementById('shareFallbackModal');
    }

    var encCaption = encodeURIComponent(caption);

    // WhatsApp - text only (image will be in URL preview)
    document.getElementById('fbWhatsApp').href = 'https://wa.me/?text=' + encCaption;

    // Facebook
    var productUrl = window.location.origin + '/api/share/product/' + currentProduct._id;
    document.getElementById('fbFacebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(productUrl);

    // Twitter
    document.getElementById('fbTwitter').href = 'https://twitter.com/intent/tweet?text=' + encCaption;

    // Store for copy/download
    window._currentCaption = caption;
    window._currentImageUrl = imageUrl;

    modal.classList.add('active');
}

function createShareModal() {
    var modal = document.createElement('div');
    modal.id = 'shareFallbackModal';
    modal.className = 'share-fallback-modal';
    modal.innerHTML =
        '<div class="share-fallback-box">' +
            '<div class="share-fallback-head">' +
                '<h3>Share Product</h3>' +
                '<button class="share-close-btn" onclick="closeShareFallback()"><i class="fas fa-times"></i></button>' +
            '</div>' +
            '<p style="font-size:13px;color:#666;margin-bottom:15px;">' +
                'For best results: Download image, copy caption, then post manually on Instagram/Facebook' +
            '</p>' +
            '<div class="share-fallback-actions">' +
                '<button onclick="downloadProductImage()" class="share-copy" style="grid-column:1/-1;background:#d4af37;color:#fff;"><i class="fas fa-download"></i> Download Image</button>' +
                '<button onclick="copyShareCaption()" class="share-copy" style="grid-column:1/-1;background:#2c3e50;color:#fff;"><i class="fas fa-copy"></i> Copy Caption Text</button>' +
                '<a href="#" id="fbWhatsApp" target="_blank" class="share-wa"><i class="fab fa-whatsapp"></i> WhatsApp</a>' +
                '<a href="#" id="fbFacebook" target="_blank" class="share-fb"><i class="fab fa-facebook-f"></i> Facebook</a>' +
                '<a href="#" id="fbTwitter" target="_blank" class="share-x"><i class="fab fa-twitter"></i> Twitter</a>' +
                '<button onclick="openInstagram()" class="share-copy" style="background:#E1306C;color:#fff;"><i class="fab fa-instagram"></i> Instagram</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeShareFallback();
    });
}

function closeShareFallback() {
    var modal = document.getElementById('shareFallbackModal');
    if (modal) modal.classList.remove('active');
}

async function copyShareCaption() {
    try {
        await navigator.clipboard.writeText(window._currentCaption || '');
        showToast('✅ Caption copied! Paste it anywhere', 'success');
    } catch(e) {
        showToast('❌ Copy failed', 'error');
    }
}

async function downloadProductImage() {
    if (!window._currentImageUrl) {
        showToast('❌ No image', 'error');
        return;
    }
    try {
        showToast('📥 Downloading...', 'success');
        const response = await fetch(window._currentImageUrl);
        const blob = await response.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        const fileName = (currentProduct.name || 'product')
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase()
            .substring(0, 30) + '.' + ext;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('✅ Image downloaded!', 'success');
    } catch(e) {
        showToast('❌ Download failed', 'error');
    }
}

function openInstagram() {
    copyShareCaption();
    downloadProductImage();
    setTimeout(function() {
        window.open('https://www.instagram.com/', '_blank');
    }, 500);
    showToast('📸 Image downloaded + caption copied. Open Instagram and paste!', 'success');
}

