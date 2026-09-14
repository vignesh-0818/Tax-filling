/* ==================================================
   Theme & RTL Toggle Logic
================================================== */

function updateThemeIcons() {
    const isDark = document.body && document.body.classList.contains('dark-mode');
    document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
        if (isDark) {
            icon.classList.remove('bi-moon-stars', 'bi-moon');
            icon.classList.add('bi-sun-fill');
        } else {
            icon.classList.remove('bi-sun-fill', 'bi-sun');
            icon.classList.add('bi-moon-stars');
        }
    });
}

/**
 * Updates all RTL/LTR toggle buttons across the website.
 * Rule:
 * - When in LTR mode: button must display "RTL" (the action it will perform next)
 * - When in RTL mode: button must display "LTR" (the action it will perform next)
 */
function updateRtlButtons(dir) {
    const isRtl = (dir === 'rtl');
    const nextActionLabel = isRtl ? 'LTR' : 'RTL';
    const nextActionAria = isRtl ? 'Switch to LTR layout' : 'Switch to RTL layout';
    const nextActionTitle = isRtl ? 'Switch to LTR direction' : 'Switch to RTL direction';

    const rtlBtns = document.querySelectorAll('.rtl-toggle-btn, #rtlToggleBtn, .topbar-rtl-btn');
    rtlBtns.forEach(btn => {
        btn.textContent = nextActionLabel;
        btn.setAttribute('aria-label', nextActionAria);
        if (btn.hasAttribute('title')) {
            btn.setAttribute('title', nextActionTitle);
        }
    });
}

/**
 * Applies the layout direction and synchronizes state
 */
function applyDirection(newDir) {
    const isRtl = (newDir === 'rtl');
    const finalDir = isRtl ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', finalDir);
    document.documentElement.setAttribute('lang', isRtl ? 'ar' : 'en');
    localStorage.setItem('dir', finalDir);
    localStorage.setItem('tcRtl', isRtl ? 'true' : 'false');

    updateRtlButtons(finalDir);

    // Synchronize appearance toggle if it exists (e.g. settings page)
    const appearRtl = document.getElementById('appearanceRtlToggle');
    if (appearRtl) {
        appearRtl.classList.toggle('on', isRtl);
    }

    window.dispatchEvent(new CustomEvent('rtlChanged', { detail: { dir: finalDir, isRtl } }));
}

// Immediate initial execution on script parse to set dir on <html> early
(function initRtlEarly() {
    const storedDir = localStorage.getItem('dir') || (localStorage.getItem('tcRtl') === 'true' ? 'rtl' : 'ltr');
    if (storedDir === 'rtl') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
    }
})();

function initThemeAndRtl() {
    // Theme setup
    const isDarkStored = localStorage.getItem('tcDarkMode') === 'true' || 
                         localStorage.getItem('theme') === 'dark' || 
                         localStorage.getItem('taxcoreTheme') === 'dark';
    if (isDarkStored) {
        if (document.body) document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
    } else {
        if (document.body) document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark-mode');
    }
    updateThemeIcons();
    
    // RTL setup on DOM ready: read stored direction and update button labels
    const currentDir = localStorage.getItem('dir') || (localStorage.getItem('tcRtl') === 'true' ? 'rtl' : 'ltr');
    applyDirection(currentDir);

    // Theme Toggle Button
    const themeBtns = document.querySelectorAll('.theme-toggle-btn');
    themeBtns.forEach(btn => {
        if (btn.dataset.themeBound) return;
        btn.dataset.themeBound = 'true';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (document.body) document.body.classList.toggle('dark-mode');
            const isDark = document.body ? document.body.classList.contains('dark-mode') : false;
            document.documentElement.classList.toggle('dark-mode', isDark);
            localStorage.setItem('tcDarkMode', isDark ? 'true' : 'false');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            localStorage.setItem('taxcoreTheme', isDark ? 'dark' : 'light');
            updateThemeIcons();
            
            // Dispatch event for charts if they exist
            window.dispatchEvent(new Event('themeChanged'));
        });
    });

    // RTL Toggle Button
    const rtlBtns = document.querySelectorAll('.rtl-toggle-btn, #rtlToggleBtn, .topbar-rtl-btn');
    rtlBtns.forEach(btn => {
        if (btn.dataset.rtlBound) return;
        btn.dataset.rtlBound = 'true';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const current = document.documentElement.getAttribute('dir') || 'ltr';
            const nextDir = current === 'rtl' ? 'ltr' : 'rtl';
            applyDirection(nextDir);
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeAndRtl);
} else {
    initThemeAndRtl();
}

// Listen for storage changes across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'dir' || e.key === 'tcRtl') {
        const updatedDir = localStorage.getItem('dir') || (localStorage.getItem('tcRtl') === 'true' ? 'rtl' : 'ltr');
        applyDirection(updatedDir);
    }
});

// Global helpers
window.applyDirection = applyDirection;
window.updateRtlButtons = updateRtlButtons;
