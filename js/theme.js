/* ==================================================
   Theme & RTL Toggle Logic
================================================== */

function updateThemeIcons() {
    const isDark = document.body.classList.contains('dark-mode');
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

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const currentTheme = localStorage.getItem('theme') || localStorage.getItem('taxcoreTheme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    updateThemeIcons();
    
    // RTL setup
    const currentDir = localStorage.getItem('dir') || 'ltr';
    if (currentDir === 'rtl') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    }

    // Theme Toggle Button
    const themeBtns = document.querySelectorAll('.theme-toggle-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            localStorage.setItem('taxcoreTheme', isDark ? 'dark' : 'light');
            updateThemeIcons();
            
            // Dispatch event for charts if they exist
            window.dispatchEvent(new Event('themeChanged'));
        });
    });

    // RTL Toggle Button
    const rtlBtns = document.querySelectorAll('.rtl-toggle-btn');
    rtlBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const current = document.documentElement.getAttribute('dir');
            const newDir = current === 'rtl' ? 'ltr' : 'rtl';
            
            document.documentElement.setAttribute('dir', newDir);
            document.documentElement.setAttribute('lang', newDir === 'rtl' ? 'ar' : 'en');
            localStorage.setItem('dir', newDir);
        });
    });
});
