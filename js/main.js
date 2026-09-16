/* ==================================================
   Main JavaScript (Navigation, Newsletters, etc.)
================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Dropdown Logic
    const dropdownToggles = document.querySelectorAll('.navbar-theme .dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            if (window.innerWidth >= 992) {
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                }
            } else {
                e.preventDefault();
                e.stopPropagation(); // prevent bubbling to document
                
                const menu = this.nextElementSibling;
                const isOpen = menu.classList.contains('show');
                
                // Close all other dropdowns
                document.querySelectorAll('.navbar-theme .dropdown-menu').forEach(m => {
                    m.classList.remove('show');
                });
                
                if (!isOpen) {
                    menu.classList.add('show');
                }
            }
        });
    });
    
    // Click outside closes dropdown on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992) {
            const isDropdown = e.target.closest('.dropdown');
            if (!isDropdown) {
                document.querySelectorAll('.navbar-theme .dropdown-menu').forEach(m => {
                    m.classList.remove('show');
                });
            }
        }
    });

    // Newsletter Form Logic
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            
            if (validateEmail(emailInput.value)) {
                showToast("Thank you for subscribing!");
                this.reset();
            } else {
                // Optionally show error, but standard HTML5 validation might catch it first
                emailInput.classList.add('is-invalid');
            }
        });
        
        // Remove invalid state on input
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                this.classList.remove('is-invalid');
            });
        }
    });

    // Pricing Toggle Logic
    const pricingToggle = document.getElementById('pricing-toggle');
    if (pricingToggle) {
        pricingToggle.addEventListener('change', function() {
            const isYearly = this.checked;
            document.querySelectorAll('.price-amount').forEach(el => {
                if (isYearly) {
                    el.textContent = el.getAttribute('data-yearly');
                } else {
                    el.textContent = el.getAttribute('data-monthly');
                }
            });
            document.querySelectorAll('.price-period').forEach(el => {
                el.textContent = isYearly ? '/year' : '/month';
            });
        });
    }

    // Dynamic Public Navbar Authentication Detection
    updatePublicNavbarAuth();
});

// Dynamic Public Navbar Authentication Detection & Logout System
function handleNavLogout(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (window.TaxCoreAuth && typeof TaxCoreAuth.clearCurrentUser === 'function') {
        TaxCoreAuth.clearCurrentUser();
    } else {
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('customerLoggedIn');
            localStorage.removeItem('taxcoreAdminLoggedIn');
        } catch (err) {}
    }
    try {
        localStorage.removeItem('tcRememberEmail');
        localStorage.removeItem('rememberEmail');
        sessionStorage.removeItem('tcRememberEmail');
    } catch (err) {}
    window.location.href = 'login.html';
}

function updatePublicNavbarAuth() {
    let user = null;
    try {
        if (window.TaxCoreAuth && typeof TaxCoreAuth.getCurrentUser === 'function') {
            user = TaxCoreAuth.getCurrentUser();
        }
        if (!user) {
            const raw = localStorage.getItem('currentUser');
            if (raw) {
                user = JSON.parse(raw);
            }
        }
    } catch (e) {
        user = null;
    }

    const navContainer = document.querySelector('.navbar-theme .nav-buttons-mobile') || document.querySelector('.nav-buttons-mobile');
    let navLoginBtn = document.getElementById('navLoginBtn');
    let navDashboardBtn = document.getElementById('navDashboardBtn');
    let navGetStartedBtn = document.getElementById('navGetStartedBtn');
    let navLogoutBtn = document.getElementById('navLogoutBtn');

    // Fallback lookups by attribute if IDs are missing in older templates
    if (!navLoginBtn && navContainer) {
        navLoginBtn = navContainer.querySelector('a[href="login.html"]:not(#navLogoutBtn)');
    }
    if (!navGetStartedBtn && navContainer) {
        navGetStartedBtn = navContainer.querySelector('a[href="register.html"]');
    }

    // Dynamic creation of Dashboard button if missing
    if (!navDashboardBtn && navLoginBtn && navLoginBtn.parentElement) {
        navDashboardBtn = document.createElement('a');
        navDashboardBtn.id = 'navDashboardBtn';
        navDashboardBtn.className = 'nav-link fw-semibold';
        navDashboardBtn.textContent = 'Dashboard';
        navDashboardBtn.href = 'dashboard.html';
        navLoginBtn.parentElement.insertBefore(navDashboardBtn, navLoginBtn);
    }

    // Dynamic creation of Logout button if missing
    if (!navLogoutBtn && navGetStartedBtn && navGetStartedBtn.parentElement) {
        navLogoutBtn = document.createElement('a');
        navLogoutBtn.id = 'navLogoutBtn';
        navLogoutBtn.className = 'btn btn-primary-brand btn-sm px-3';
        navLogoutBtn.textContent = 'Logout';
        navLogoutBtn.href = 'login.html';
        navGetStartedBtn.parentElement.appendChild(navLogoutBtn);
    }

    // Safely attach click listener to Logout button
    if (navLogoutBtn && !navLogoutBtn._logoutBound) {
        navLogoutBtn._logoutBound = true;
        navLogoutBtn.addEventListener('click', handleNavLogout);
    }

    // Dashboard points to the customer/student dashboard (dashboard.html) and remains visible
    if (navDashboardBtn) {
        navDashboardBtn.setAttribute('href', 'dashboard.html');
        if (!navDashboardBtn.textContent.trim()) {
            navDashboardBtn.textContent = 'Dashboard';
        }
        navDashboardBtn.style.display = '';
        navDashboardBtn.classList.remove('d-none');
    }

    const isLoggedIn = Boolean(user && (user.role || user.name || user.email));

    if (isLoggedIn) {
        // User is logged in:
        // 1. Hide Login button
        if (navLoginBtn) {
            navLoginBtn.style.display = 'none';
            navLoginBtn.classList.add('d-none');
        }

        // 2. Hide Get Started button
        if (navGetStartedBtn) {
            navGetStartedBtn.style.display = 'none';
            navGetStartedBtn.classList.add('d-none');
        }

        // 3. Show Logout button beside Dashboard
        if (navLogoutBtn) {
            navLogoutBtn.style.display = '';
            navLogoutBtn.classList.remove('d-none');
        }
    } else {
        // Nobody is logged in:
        // 1. Show Login button
        if (navLoginBtn) {
            navLoginBtn.style.display = '';
            navLoginBtn.classList.remove('d-none');
        }

        // 2. Show Get Started button (pointing to register.html)
        if (navGetStartedBtn) {
            navGetStartedBtn.setAttribute('href', 'register.html');
            navGetStartedBtn.style.display = '';
            navGetStartedBtn.classList.remove('d-none');
        }

        // 3. Hide Logout button
        if (navLogoutBtn) {
            navLogoutBtn.style.display = 'none';
            navLogoutBtn.classList.add('d-none');
        }
    }
}

if (typeof window !== 'undefined') {
    window.updatePublicNavbarAuth = updatePublicNavbarAuth;
    window.handleNavLogout = handleNavLogout;
    window.addEventListener('pageshow', updatePublicNavbarAuth);
    window.addEventListener('storage', updatePublicNavbarAuth);
}

if (typeof document !== 'undefined' && document.readyState !== 'loading') {
    updatePublicNavbarAuth();
}

// Toast Notification System
function showToast(message) {
    let toast = document.getElementById('global-toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'toast-msg';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Strict email validation helper
function validateEmail(email) {
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*)*\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
}
