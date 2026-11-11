
// ===== META COMMERCE URL HANDLER =====
// Meta sends: /checkout?products=PRODUCT_ID:QUANTITY&coupon=CODE
function handleMetaCheckoutUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productsParam = urlParams.get('products');
    const couponParam   = urlParams.get('coupon');

    if (!productsParam) return false; // Not a Meta checkout URL

    console.log('🛒 Meta checkout URL detected:', productsParam);

    const API_BASE = '/api';
    const metaItems = [];
    const entries = productsParam.split(',');

    // Parse product IDs and quantities
    const promises = entries.map(async function(entry) {
        const parts = entry.split(':');
        const productId  = parts[0];
        const quantity   = parseInt(parts[1]) || 1;

        try {
            const res  = await fetch(API_BASE + '/products/' + productId);
            const data = await res.json();
            const p    = data.product || data;

            if (p && p._id) {
                const price = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
                const img   = p.images && p.images.length > 0
                    ? (p.images[0].startsWith('/') || p.images[0].startsWith('http')
                        ? p.images[0]
                        : '/uploads/products/' + p.images[0])
                    : '/images/placeholder.jpg';

                return {
                    id:       p._id,
                    name:     p.name,
                    price:    price,
                    image:    img,
                    size:     '',
                    color:    '',
                    quantity: quantity
                };
            }
        } catch(e) {
            console.error('Product fetch error:', e);
        }
        return null;
    });

    Promise.all(promises).then(function(items) {
        const validItems = items.filter(Boolean);
        if (validItems.length > 0) {
            // Save to cart
            localStorage.setItem('cart', JSON.stringify(validItems));
            localStorage.setItem('aura_cart', JSON.stringify(validItems));
            checkoutCart = validItems;

            // Apply coupon if exists
            if (couponParam) {
                console.log('🏷️ Coupon applied:', couponParam);
                document.getElementById('couponCode') &&
                    (document.getElementById('couponCode').value = couponParam);
            }

            displayOrderItems();
            calculateTotals();

            console.log('✅ Meta checkout loaded:', validItems.length, 'items');
        }
    });

    return true;
}

// ===================================
// AURA STUDIO - CHECKOUT PAGE
// ===================================

var checkoutCart = [];
var subtotal = 0;
var shipping = 0;
var total = 0;

// Page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Checkout page loaded');
    
    loadCart();
    initForm();
    updateCartCount();
});

// Load cart from localStorage - check multiple possible keys
function loadCart() {
    checkoutCart = JSON.parse(localStorage.getItem('aura_cart')) || 
                   JSON.parse(localStorage.getItem('cart')) || 
                   [];
    
    console.log('Cart loaded:', checkoutCart);
    console.log('Cart items:', checkoutCart.length);
    
    if (checkoutCart.length === 0) {
        showEmptyCart();
        return;
    }
    
    displayOrderItems();
    calculateTotals();
}

// Show empty cart message
function showEmptyCart() {
    var container = document.querySelector('.checkout-grid') || 
                   document.querySelector('.checkout-section .container');
    
    if (container) {
        container.innerHTML = '<div class="empty-cart" style="text-align:center;padding:80px 20px;grid-column:1/-1;">' +
            '<i class="fas fa-shopping-cart" style="font-size:80px;color:#ddd;margin-bottom:20px;display:block;"></i>' +
            '<h2 style="margin-bottom:15px;">Your cart is empty</h2>' +
            '<p style="color:#666;margin:20px 0;">Add some products to checkout</p>' +
            '<a href="products.html" class="btn btn-primary" style="display:inline-block;padding:15px 30px;background:#d4af37;color:#fff;border-radius:5px;text-decoration:none;">Continue Shopping</a>' +
            '</div>';
    }
}

// Display order items
function displayOrderItems() {
    var container = document.getElementById('orderItems') || 
                   document.querySelector('.order-items');
    
    if (!container) {
        console.error('❌ Order items container not found');
        return;
    }
    
    console.log('Displaying', checkoutCart.length, 'items');
    
    var html = '';
    checkoutCart.forEach(function(item, index) {
        var itemPrice = item.price || 0;
        var itemQty = item.quantity || 1;
        var itemTotal = itemPrice * itemQty;
        var itemImage = item.image || '/images/placeholder.jpg';
        var itemName = item.name || 'Product';
        var itemSize = item.size || '';
        var itemColor = item.color || '';
        
        html += '<div class="order-item" style="display:flex;gap:15px;padding:15px 0;border-bottom:1px solid #eee;">' +
            '<img src="' + itemImage + '" alt="' + itemName + '" style="width:70px;height:85px;object-fit:cover;border-radius:8px;" onerror="this.src=\'/images/placeholder.jpg\'">' +
            '<div style="flex:1;">' +
            '<h4 style="font-size:14px;margin-bottom:5px;">' + itemName + '</h4>' +
            '<p style="font-size:12px;color:#666;margin:0;">Qty: ' + itemQty + 
            (itemSize ? ' | Size: ' + itemSize : '') + 
            (itemColor ? ' | Color: ' + itemColor : '') + '</p>' +
            '<p style="font-weight:600;color:#d4af37;margin-top:5px;">Rs. ' + itemTotal.toLocaleString() + '</p>' +
            '</div>' +
            '</div>';
    });
    
    container.innerHTML = html;
    console.log('✅ Order items displayed');
}

// Calculate totals
function calculateTotals() {
    subtotal = 0;
    
    checkoutCart.forEach(function(item) {
        var itemPrice = item.price || 0;
        var itemQty = item.quantity || 1;
        subtotal += itemPrice * itemQty;
    });
    
    // Free shipping over 10000
    shipping = subtotal >= 10000 ? 0 : 200;
    total = subtotal + shipping;
    
    console.log('Totals:', { subtotal: subtotal, shipping: shipping, total: total });
    
    // Update UI
    var subtotalEl = document.getElementById('subtotal');
    var shippingEl = document.getElementById('shipping');
    var totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = 'Rs. ' + subtotal.toLocaleString();
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : 'Rs. ' + shipping.toLocaleString();
    if (totalEl) totalEl.textContent = 'Rs. ' + total.toLocaleString();
}

// Initialize form
function initForm() {
    var form = document.getElementById('checkoutForm');
    
    if (form) {
        form.addEventListener('submit', handleSubmit);
        console.log('✅ Checkout form initialized');
    } else {
        console.error('❌ Checkout form not found');
    }
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('📦 Placing order...');
    
    var submitBtn = document.getElementById('placeOrderBtn') || e.target.querySelector('button[type="submit"]');
    var originalText = submitBtn ? submitBtn.innerHTML : 'Place Order';
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
    }
    
    try {
        // Get form values
        var name = document.getElementById('name');
        var email = document.getElementById('email');
        var phone = document.getElementById('phone');
        var address = document.getElementById('address');
        var city = document.getElementById('city');
        var postalCode = document.getElementById('postalCode');
        var notes = document.getElementById('notes');
        
        // Get payment method
        var paymentMethod = 'cod';
        var paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        if (paymentRadio) {
            paymentMethod = paymentRadio.value;
        }
        
        // Validate
        if (!name || !name.value.trim()) throw new Error('Name is required');
        if (!email || !email.value.trim()) throw new Error('Email is required');
        if (!phone || !phone.value.trim()) throw new Error('Phone is required');
        if (!address || !address.value.trim()) throw new Error('Address is required');
        if (!city || !city.value.trim()) throw new Error('City is required');
        
        // Build order items
        var orderItems = checkoutCart.map(function(item) {
            return {
                product: item.id || item._id || null, // Ensure product ID is passed
                productName: item.name || 'Product',
                productImage: item.image || '',
                price: item.price || 0,
                quantity: item.quantity || 1,
                size: item.size || '',
                color: item.color || ''
            };
        });
        
        // Build order data
        var orderData = {
            customer: {
                name: name.value.trim(),
                email: email.value.trim(),
                phone: phone.value.trim(),
                address: address.value.trim(),
                city: city.value.trim(),
                postalCode: postalCode ? postalCode.value.trim() : '',
                notes: notes ? notes.value.trim() : ''
            },
            items: orderItems,
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            paymentMethod: paymentMethod
        };
        
        console.log('Order data:', orderData);
        
        // Send to API
        // Create FormData
var formData = new FormData();
formData.append('customer', JSON.stringify(orderData.customer));
formData.append('items', JSON.stringify(orderData.items));
formData.append('subtotal', orderData.subtotal);
formData.append('shipping', orderData.shipping);
formData.append('total', orderData.total);
formData.append('paymentMethod', orderData.paymentMethod);

// Add screenshot if uploaded
var screenshotInput = document.getElementById('paymentProof');
if (screenshotInput && screenshotInput.files && screenshotInput.files[0]) {
    formData.append('paymentProof', screenshotInput.files[0]);
    console.log('📸 Screenshot attached');
}

// Send to API
var response = await fetch('/api/orders', {
    method: 'POST',
    body: formData
});
        
        var data = await response.json();
        console.log('Response:', data);
        
        if (response.ok && data.success) {
            // Clear cart
            localStorage.removeItem('aura_cart');
            localStorage.removeItem('cart');
            
            // Show success
            showOrderSuccess(data.orderNumber || (data.order && data.order.orderNumber) || 'N/A');
        } else {
            throw new Error(data.message || 'Failed to place order');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
        
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Show order success
function showOrderSuccess(orderNumber) {
    var section = document.querySelector('.checkout-section');
    
    if (section) {
        section.innerHTML = '<div class="container">' +
            '<div style="text-align:center;padding:80px 20px;max-width:600px;margin:0 auto;">' +
            '<div style="width:100px;height:100px;background:#27ae60;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 30px;">' +
            '<i class="fas fa-check" style="font-size:50px;color:#fff;"></i>' +
            '</div>' +
            '<h1 style="color:#27ae60;margin-bottom:15px;">Order Placed Successfully!</h1>' +
            '<p style="font-size:18px;color:#666;margin-bottom:10px;">Thank you for your order</p>' +
            '<p style="font-size:28px;font-weight:700;color:#333;margin-bottom:30px;">Order #: ' + orderNumber + '</p>' +
            '<div style="background:#f8f9fa;padding:25px;border-radius:12px;margin-bottom:30px;text-align:left;">' +
            '<h3 style="margin-bottom:15px;"><i class="fas fa-info-circle" style="color:#d4af37;"></i> What happens next?</h3>' +
            '<ul style="color:#666;line-height:2;padding-left:20px;">' +
            '<li>You will receive order confirmation via SMS/WhatsApp</li>' +
            '<li>Our team will contact you to confirm delivery details</li>' +
            '<li>Estimated delivery: 3-5 business days</li>' +
            '</ul>' +
            '</div>' +
            '<div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;">' +
            '<a href="products.html" class="btn btn-primary" style="padding:15px 30px;background:#d4af37;color:#fff;border-radius:5px;text-decoration:none;">Continue Shopping</a>' +
            '<a href="index.html" class="btn btn-secondary" style="padding:15px 30px;background:#2c3e50;color:#fff;border-radius:5px;text-decoration:none;">Go to Home</a>' +
            '</div>' +
            '</div>' +
            '</div>';
    }
    
    updateCartCount();
}

// Update cart count
function updateCartCount() {
    var cartData = JSON.parse(localStorage.getItem('aura_cart')) || 
                   JSON.parse(localStorage.getItem('cart')) || [];
    var totalItems = cartData.reduce(function(sum, item) { 
        return sum + (item.quantity || 1); 
    }, 0);
    
    document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = totalItems;
    });
}
