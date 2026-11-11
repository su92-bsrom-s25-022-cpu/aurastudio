// ===================================
// AURA STUDIO - ADMIN PANEL JAVASCRIPT
// © 2026 Aura Studio
// ===================================

const API_URL = '/api';

// Check Authentication
document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check for login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }

    // Check token - use 'token' (same as login.html saves)
    const token = localStorage.getItem('admin_token');
    if (!token) {
        console.log('❌ No token found, redirecting to login...');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    console.log('✅ Token found, user authenticated');

    // Load admin info
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const adminNameElements = document.querySelectorAll('#adminName');
    adminNameElements.forEach(el => {
        el.textContent = admin.name || 'Admin';
    });

    // Initialize sidebar
    initSidebar();

    // Initialize logout
    initLogout();
});

// Sidebar Toggle
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (!sidebar.contains(e.target) && !mobileToggle?.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin');
                window.location.href = 'login.html';
            }
        });
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('admin_token');

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    if (!(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        window.location.href = 'login.html';
        return;
    }

    return response;
}

// Format Price
function formatPrice(price) {
    return 'Rs. ' + Number(price).toLocaleString('en-PK');
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format DateTime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show Notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.admin-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:' + (type === 'success' ? '#4CAF50' : '#f44336') + ';color:white;padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;display:flex;align-items:center;gap:10px;';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Confirm Dialog
function confirmDialog(message) {
    return confirm(message);
}

// Handle Image Preview
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input || !preview) return;

    input.addEventListener('change', function(e) {
        preview.innerHTML = '';

        Array.from(e.target.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'image-preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global use
window.API_URL = API_URL;
window.apiRequest = apiRequest;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.showNotification = showNotification;
window.confirmDialog = confirmDialog;
window.setupImagePreview = setupImagePreview;
window.debounce = debounce;
