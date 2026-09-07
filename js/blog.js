/* ==================================================
   TaxCore Blog Filtering, Search & Tag Logic
================================================== */

function initBlogPage() {
    const blogSearch = document.getElementById('blog-search');
    const categoryBtns = document.querySelectorAll('.category-filter-btn');
    const blogCards = document.querySelectorAll('.blog-card-item');
    const noResultsMsg = document.getElementById('no-blog-results');
    const sidebarTagLinks = document.querySelectorAll('#blog-sidebar-tags .sidebar-tag-badge');

    let currentTag = null;

    function filterBlogs() {
        const activeBtn = document.querySelector('.category-filter-btn.active');
        const activeCategory = activeBtn ? (activeBtn.getAttribute('data-category') || 'all').toLowerCase().trim() : 'all';
        const sidebarSearch = document.getElementById('sidebar-blog-search');
        const searchQuery = (blogSearch && blogSearch.value ? blogSearch.value : (sidebarSearch ? sidebarSearch.value : '')).toLowerCase().trim();

        let visibleCount = 0;

        // Typo mappings & search tokenization
        const typos = {
            'calender': 'calendar',
            'calander': 'calendar',
            'acounting': 'accounting',
            'accouting': 'accounting',
            'filng': 'filing',
            'plannig': 'planning'
        };

        const rawTokens = searchQuery ? searchQuery.split(/\s+/).filter(Boolean) : [];
        const searchTokens = rawTokens.map(t => typos[t] || t);

        blogCards.forEach(card => {
            const cardCategory = (card.getAttribute('data-category') || '').toLowerCase().trim();
            const cardAuthor = (card.getAttribute('data-author') || '').toLowerCase().trim();
            const cardTags = (card.getAttribute('data-tags') || '').toLowerCase().trim();
            
            const titleElem = card.querySelector('.blog-title');
            const descElem = card.querySelector('.blog-desc');
            
            const cardTitle = titleElem ? titleElem.innerText.toLowerCase().trim() : '';
            const cardDesc = descElem ? descElem.innerText.toLowerCase().trim() : '';

            // Category match: if user has a search query, search across all cards
            const matchCategory = !searchQuery ? (activeCategory === 'all' || cardCategory === activeCategory) : true;

            // Tag match
            let matchTag = true;
            if (currentTag) {
                const tagLower = currentTag.toLowerCase().trim();
                matchTag = cardTags.includes(tagLower) || 
                           cardCategory.includes(tagLower) || 
                           cardTitle.includes(tagLower) || 
                           cardDesc.includes(tagLower);
            }

            // Search match (Exact phrase, full query, or tokenized match with typo tolerance)
            let matchSearch = true;
            if (searchQuery) {
                const combined = `${cardTitle} ${cardDesc} ${cardAuthor} ${cardCategory} ${cardTags}`;
                if (combined.includes(searchQuery)) {
                    matchSearch = true;
                } else {
                    const matchedTokens = searchTokens.filter(tok => combined.includes(tok));
                    matchSearch = matchedTokens.length > 0;
                }
            }

            if (matchCategory && matchTag && matchSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noResultsMsg) {
            noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Category button click handlers
    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = (btn.getAttribute('data-category') || '').toLowerCase().trim();
                
                // Remove active class from all buttons
                categoryBtns.forEach(b => {
                    b.classList.remove('active', 'btn-primary-brand');
                    b.classList.add('btn-outline-brand');
                });
                
                // Add active class to clicked button
                btn.classList.remove('btn-outline-brand');
                btn.classList.add('active', 'btn-primary-brand');

                // If user selected a specific category that does not match currentTag, clear tag
                if (currentTag && currentTag !== cat) {
                    currentTag = null;
                    sidebarTagLinks.forEach(t => t.classList.remove('active'));
                    // Update URL
                    const newUrl = cat === 'all' ? 'blog.html' : `blog.html?category=${encodeURIComponent(cat)}`;
                    window.history.pushState({}, '', newUrl);
                }
                
                filterBlogs();
            });
        });
    }

    // Sidebar tag click handlers
    if (sidebarTagLinks.length > 0) {
        sidebarTagLinks.forEach(tagLink => {
            const href = tagLink.getAttribute('href');
            // If the tag links directly to another page, allow natural redirect without preventDefault
            if (href && href !== '#' && !href.startsWith('#') && !href.startsWith('javascript:')) {
                return;
            }

            tagLink.addEventListener('click', (e) => {
                e.preventDefault();
                const tagVal = (tagLink.getAttribute('data-tag') || '').toLowerCase().trim();
                
                if (currentTag === tagVal) {
                    // Deselect active tag
                    currentTag = null;
                    tagLink.classList.remove('active');
                    window.history.pushState({}, '', 'blog.html');
                } else {
                    currentTag = tagVal;
                    sidebarTagLinks.forEach(t => t.classList.remove('active'));
                    tagLink.classList.add('active');

                    // If tag is 'business finance', activate the Business Finance category button
                    if (tagVal === 'business finance') {
                        const bfBtn = Array.from(categoryBtns).find(b => 
                            (b.getAttribute('data-category') || '').toLowerCase() === 'business finance'
                        );
                        if (bfBtn) {
                            categoryBtns.forEach(b => {
                                b.classList.remove('active', 'btn-primary-brand');
                                b.classList.add('btn-outline-brand');
                            });
                            bfBtn.classList.remove('btn-outline-brand');
                            bfBtn.classList.add('active', 'btn-primary-brand');
                        }
                    } else {
                        // Reset category to "all" so tag filter shows all matching cards across categories
                        const allBtn = Array.from(categoryBtns).find(b => 
                            (b.getAttribute('data-category') || '').toLowerCase() === 'all'
                        );
                        if (allBtn) {
                            categoryBtns.forEach(b => {
                                b.classList.remove('active', 'btn-primary-brand');
                                b.classList.add('btn-outline-brand');
                            });
                            allBtn.classList.remove('btn-outline-brand');
                            allBtn.classList.add('active', 'btn-primary-brand');
                        }
                    }

                    window.history.pushState({}, '', `blog.html?tag=${encodeURIComponent(tagVal)}`);
                }

                filterBlogs();
            });
        });
    }

    // URL Query parameters handling
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    const searchParam = urlParams.get('search');
    const tagParam = urlParams.get('tag');

    if (tagParam) {
        const cleanTag = tagParam.toLowerCase().trim();
        currentTag = cleanTag;

        // Highlight matching sidebar tag
        sidebarTagLinks.forEach(t => {
            if ((t.getAttribute('data-tag') || '').toLowerCase().trim() === cleanTag) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        if (cleanTag === 'business finance') {
            const bfBtn = Array.from(categoryBtns).find(b => 
                (b.getAttribute('data-category') || '').toLowerCase() === 'business finance'
            );
            if (bfBtn) {
                categoryBtns.forEach(b => {
                    b.classList.remove('active', 'btn-primary-brand');
                    b.classList.add('btn-outline-brand');
                });
                bfBtn.classList.remove('btn-outline-brand');
                bfBtn.classList.add('active', 'btn-primary-brand');
            }
        } else {
            // For other tags, ensure category is 'all'
            const allBtn = Array.from(categoryBtns).find(b => 
                (b.getAttribute('data-category') || '').toLowerCase() === 'all'
            );
            if (allBtn) {
                categoryBtns.forEach(b => {
                    b.classList.remove('active', 'btn-primary-brand');
                    b.classList.add('btn-outline-brand');
                });
                allBtn.classList.remove('btn-outline-brand');
                allBtn.classList.add('active', 'btn-primary-brand');
            }
        }

        filterBlogs();
    } else if (catParam) {
        const cleanCat = catParam.toLowerCase().trim();
        const targetBtn = Array.from(categoryBtns).find(b => 
            (b.getAttribute('data-category') || '').toLowerCase() === cleanCat
        );
        if (targetBtn) {
            targetBtn.click();
        } else {
            filterBlogs();
        }

        // If category is business finance, also highlight the tag
        if (cleanCat === 'business finance') {
            sidebarTagLinks.forEach(t => {
                if ((t.getAttribute('data-tag') || '').toLowerCase().trim() === 'business finance') {
                    t.classList.add('active');
                }
            });
        }
    }

    if (searchParam) {
        if (blogSearch) blogSearch.value = searchParam;
        const sidebarInput = document.getElementById('sidebar-blog-search');
        if (sidebarInput) sidebarInput.value = searchParam;

        // Activate "All" category button so search finds matching posts across all categories
        categoryBtns.forEach(b => {
            const isAll = (b.getAttribute('data-category') || '').toLowerCase() === 'all';
            b.classList.toggle('active', isAll);
            b.classList.toggle('btn-primary-brand', isAll);
            b.classList.toggle('btn-outline-brand', !isAll);
        });

        filterBlogs();
    }

    // Search input handlers
    if (blogSearch) {
        blogSearch.addEventListener('input', filterBlogs);
    }
    const sidebarSearch = document.getElementById('sidebar-blog-search');
    const sidebarSearchBtn = document.getElementById('sidebar-blog-search-btn');
    if (sidebarSearch) {
        sidebarSearch.addEventListener('input', () => {
            if (blogSearch) blogSearch.value = sidebarSearch.value;
            filterBlogs();
        });
        sidebarSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (blogSearch) blogSearch.value = sidebarSearch.value;
                filterBlogs();
            }
        });
    }
    if (sidebarSearchBtn) {
        sidebarSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (blogSearch && sidebarSearch) blogSearch.value = sidebarSearch.value;
            filterBlogs();
        });
    }
    if (blogSearch && sidebarSearch) {
        blogSearch.addEventListener('input', () => {
            sidebarSearch.value = blogSearch.value;
        });
    }

    // Sidebar Category links handler
    const sidebarCatLinks = document.querySelectorAll('.sidebar-cat-link');
    sidebarCatLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = (link.getAttribute('data-category') || '').toLowerCase().trim();
            const targetBtn = Array.from(categoryBtns).find(b => 
                (b.getAttribute('data-category') || '').toLowerCase().trim() === cat
            );
            if (targetBtn) {
                targetBtn.click();
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogPage);
} else {
    initBlogPage();
}
