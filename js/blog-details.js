/* ==================================================
   TaxCore Blog Details Dynamic Rendering
   Renders the specific article based on ?id= query param
================================================== */

function initBlogDetails() {
    if (typeof blogPosts === 'undefined' || !blogPosts.length) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id') || 'tax-deductions';

    const postIndex = blogPosts.findIndex(p => p.id === postId);
    const post = postIndex !== -1 ? blogPosts[postIndex] : blogPosts[0];

    // 1. Page Title & Meta Description
    document.title = `${post.title} - TaxCore Blog`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.description;

    // 2. Breadcrumbs
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = post.title;
    }

    // 3. Category Badge
    const categoryBadge = document.getElementById('detail-category');
    if (categoryBadge) {
        categoryBadge.textContent = post.category;
    }

    // 4. Article Title
    const detailTitle = document.getElementById('detail-title');
    if (detailTitle) {
        detailTitle.textContent = post.title;
    }

    // 5. Author Information
    const authorImg = document.getElementById('detail-author-img');
    if (authorImg) {
        authorImg.src = post.authorAvatar;
        authorImg.alt = post.author;
    }
    const authorName = document.getElementById('detail-author-name');
    if (authorName) {
        authorName.textContent = post.author;
    }
    const metaInfo = document.getElementById('detail-meta-info');
    if (metaInfo) {
        metaInfo.innerHTML = `${post.date} &bull; ${post.readTime}`;
    }

    // 6. Featured Image (Matches corresponding blog card)
    const detailImage = document.getElementById('detail-image');
    if (detailImage) {
        detailImage.src = post.image;
        detailImage.alt = post.imageAlt;
    }

    // 7. Full Article Content
    const detailContent = document.getElementById('detail-content');
    if (detailContent) {
        detailContent.innerHTML = post.content;
    }

    // 8. Tags Widget in Sidebar
    const sidebarTagsContainer = document.getElementById('detail-sidebar-tags');
    if (sidebarTagsContainer) {
        const standardTags = [
            { name: "Income Tax Filing", url: "income-tax.html" },
            { name: "Business Tax Planning", url: "business-tax-planning.html" },
            { name: "GST Returns", url: "gst-returns.html" },
            { name: "Bookkeeping", url: "bookkeeping.html" }
        ];
        sidebarTagsContainer.innerHTML = standardTags.map(t => 
            `<a href="${t.url}" class="sidebar-tag-badge">${t.name}</a>`
        ).join('');
    }

    // 9. Prev / Next Navigation Links
    const currentIdx = postIndex !== -1 ? postIndex : 0;
    const prevIdx = (currentIdx - 1 + blogPosts.length) % blogPosts.length;
    const nextIdx = (currentIdx + 1) % blogPosts.length;
    const prevPost = blogPosts[prevIdx];
    const nextPost = blogPosts[nextIdx];

    const prevLink = document.getElementById('detail-prev-link');
    const prevTitle = document.getElementById('detail-prev-title');
    if (prevLink && prevTitle) {
        prevLink.href = `blog-details.html?id=${prevPost.id}`;
        prevTitle.textContent = prevPost.title;
    }

    const nextLink = document.getElementById('detail-next-link');
    const nextTitle = document.getElementById('detail-next-title');
    if (nextLink && nextTitle) {
        nextLink.href = `blog-details.html?id=${nextPost.id}`;
        nextTitle.textContent = nextPost.title;
    }

    // 10. Recent Posts Widget in Sidebar
    const recentPostsContainer = document.getElementById('detail-recent-posts');
    if (recentPostsContainer) {
        const otherPosts = blogPosts.filter(p => p.id !== post.id).slice(0, 3);
        recentPostsContainer.innerHTML = otherPosts.map((p) => `
            <div class="recent-post">
                <img src="${p.image}" alt="${p.title}">
                <div class="recent-post-content">
                    <h6 class="recent-post-title">
                        <a href="blog-details.html?id=${p.id}">${p.title}</a>
                    </h6>
                    <p class="recent-post-date">${p.date}</p>
                </div>
            </div>
        `).join('');
    }

    // 11. Categories Widget in Sidebar
    const categoriesContainer = document.getElementById('detail-categories');
    if (categoriesContainer) {
        const categories = [
            { name: "Tax Tips", slug: "tax tips" },
            { name: "GST", slug: "gst" },
            { name: "Bookkeeping", slug: "bookkeeping" },
            { name: "Tax Planning", slug: "tax planning" },
            { name: "Tax Calendar", slug: "tax calendar" },
            { name: "Business Finance", slug: "business finance" }
        ];
        categoriesContainer.innerHTML = categories.map((c) => `
            <li class="category-item">
                <a href="blog.html?category=${encodeURIComponent(c.slug)}">
                    <span>${c.name}</span>
                    <span class="badge bg-secondary-theme text-dark">1</span>
                </a>
            </li>
        `).join('');
    }

    // 12. Sidebar Search (Live Interactive Autocomplete & Search Navigation)
    const searchInput = document.getElementById('sidebar-blog-search');
    const searchBtn = document.getElementById('sidebar-blog-search-btn');
    const searchForm = document.getElementById('sidebar-search-form') || (searchInput ? searchInput.closest('form') : null);
    const resultsContainer = document.getElementById('sidebar-search-results');

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m]));
    }

    function searchBlogData(rawQuery) {
        if (typeof blogPosts === 'undefined' || !blogPosts.length) return [];
        const query = (rawQuery || '').toLowerCase().trim();
        if (!query) return [];

        const typos = {
            'calender': 'calendar',
            'calander': 'calendar',
            'acounting': 'accounting',
            'accouting': 'accounting',
            'filng': 'filing',
            'plannig': 'planning'
        };

        const rawTokens = query.split(/\s+/).filter(Boolean);
        const tokens = rawTokens.map(t => typos[t] || t);

        const matches = [];
        blogPosts.forEach(p => {
            const title = (p.title || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
            const author = (p.author || '').toLowerCase();
            const combined = `${title} ${category} ${tags} ${desc} ${author}`;

            let score = 0;
            if (title.includes(query)) score += 20;
            if (category.includes(query)) score += 15;
            if (tags.includes(query)) score += 12;
            if (desc.includes(query)) score += 8;

            let tokensMatched = 0;
            tokens.forEach(tok => {
                if (combined.includes(tok)) {
                    tokensMatched++;
                    if (title.includes(tok)) score += 6;
                    if (category.includes(tok)) score += 5;
                    if (tags.includes(tok)) score += 4;
                }
            });

            if (tokensMatched === tokens.length) score += 10;

            if (score > 0 || tokensMatched > 0 || combined.includes(query)) {
                matches.push({ post: p, score: score + tokensMatched });
            }
        });

        matches.sort((a, b) => b.score - a.score);
        return matches.map(m => m.post);
    }

    function renderLiveSearchResults(query) {
        if (!resultsContainer) return;
        const trimmed = (query || '').trim();
        if (!trimmed) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
            return;
        }

        const matched = searchBlogData(trimmed);
        resultsContainer.style.display = 'block';

        if (matched.length === 0) {
            resultsContainer.innerHTML = `
                <div class="p-2 text-center">
                    <p class="small text-muted mb-1"><i class="bi bi-search me-1"></i> No articles found for "${escapeHtml(trimmed)}"</p>
                    <p class="small text-muted mb-0" style="font-size: 0.75rem;">Try searching <strong>tax</strong>, <strong>gst</strong>, <strong>bookkeeping</strong>, or <strong>calendar</strong>.</p>
                </div>
            `;
            return;
        }

        const itemsHtml = matched.map(p => `
            <a href="blog-details.html?id=${p.id}" class="search-result-item d-flex align-items-center gap-2 text-decoration-none p-2 rounded mb-1">
                <span class="badge bg-primary-brand text-white flex-shrink-0">${escapeHtml(p.category)}</span>
                <span class="search-result-title fw-semibold text-truncate small">${escapeHtml(p.title)}</span>
            </a>
        `).join('');

        resultsContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                <small class="text-muted fw-semibold" style="font-size: 0.75rem;">Matching Articles (${matched.length}):</small>
                <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 text-muted small" style="font-size: 0.75rem;" onclick="clearLiveSearch();">&times; Close</button>
            </div>
            <div class="search-results-list d-flex flex-column gap-1">
                ${itemsHtml}
            </div>
            <div class="mt-2 text-center pt-1 border-top">
                <a href="blog.html?search=${encodeURIComponent(trimmed)}" class="small text-primary-brand fw-semibold text-decoration-none" style="font-size: 0.8rem;">
                    View all on Blog page <i class="bi bi-arrow-right ms-1"></i>
                </a>
            </div>
        `;
    }

    window.executeBlogDetailsSearch = function(e) {
        if (e && e.preventDefault) e.preventDefault();
        const input = document.getElementById('sidebar-blog-search');
        const query = input ? input.value.trim() : '';
        if (!query) {
            if (input) input.focus();
            return;
        }

        // 1. Immediately display live search results so the user sees matching articles right away
        renderLiveSearchResults(query);

        // 2. Also navigate to blog.html?search=...
        window.location.href = `blog.html?search=${encodeURIComponent(query)}`;
    };

    window.clearLiveSearch = function() {
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderLiveSearchResults(e.target.value);
        });
        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim()) {
                renderLiveSearchResults(e.target.value);
            }
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                window.executeBlogDetailsSearch(e);
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', window.executeBlogDetailsSearch);
    }

    if (searchForm) {
        searchForm.addEventListener('submit', window.executeBlogDetailsSearch);
    }

    // Close live search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#sidebar-search-form')) {
            window.clearLiveSearch();
        }
    });

    // 13. Social Sharing Links
    const currentUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(post.title || document.title);

    const shareFb = document.getElementById('share-fb');
    if (shareFb) {
        shareFb.href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
    }
    const shareX = document.getElementById('share-x');
    if (shareX) {
        shareX.href = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${shareTitle}`;
    }
    const shareIn = document.getElementById('share-in');
    if (shareIn) {
        shareIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogDetails);
} else {
    initBlogDetails();
}
