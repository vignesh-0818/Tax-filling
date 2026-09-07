/* ==================================================
   Tax Calendar Logic
================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('calendar-filter');
    const searchInput = document.getElementById('calendar-search');
    const rows = document.querySelectorAll('.calendar-row');
    
    if (filterSelect && searchInput) {
        
        function filterCalendar() {
            const category = filterSelect.value.toLowerCase();
            const search = searchInput.value.toLowerCase();
            
            rows.forEach(row => {
                const rowCategory = (row.getAttribute('data-category') || '').toLowerCase();
                const rowText = row.innerText.toLowerCase();
                
                const matchCategory = category === 'all' || rowCategory.split(/\s+/).includes(category) || rowCategory.includes(category);
                const matchSearch = rowText.includes(search);
                
                if (matchCategory && matchSearch) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        filterSelect.addEventListener('change', filterCalendar);
        searchInput.addEventListener('input', filterCalendar);
    }

    // Smooth scroll and pulse highlight if arriving with hash anchor (e.g. #deadline-oct-15)
    function handleCalendarHash() {
        if (window.location.hash) {
            setTimeout(() => {
                try {
                    const target = document.querySelector(window.location.hash);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        target.classList.add('highlight-section-target');
                        setTimeout(() => target.classList.remove('highlight-section-target'), 2600);
                    }
                } catch (e) {}
            }, 180);
        }
    }

    handleCalendarHash();
    window.addEventListener('hashchange', handleCalendarHash);
});
