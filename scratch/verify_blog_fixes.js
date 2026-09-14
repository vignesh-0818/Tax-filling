const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome-data-full');
const ARTIFACTS_DIR = "C:\\Users\\vv356\\.gemini\\antigravity-ide\\brain\\a6015b53-60a6-4cc2-bfd3-2f3ac68d9e16";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== STARTING BLOG & BLOG DETAILS COMPREHENSIVE VERIFICATION ===\n');

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pending.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const pageRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await pageRes.json();
  const pageWsUrl = pages.find(p => p.id === target.targetId)?.webSocketDebuggerUrl;

  const pageWs = new WebSocket(pageWsUrl);
  await new Promise(r => pageWs.onopen = r);

  let pageId = 1;
  const pagePending = new Map();
  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pagePending.has(msg.id)) {
      const { resolve, reject } = pagePending.get(msg.id);
      pagePending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
  function pageSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = pageId++;
      pagePending.set(reqId, { resolve, reject });
      pageWs.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  async function evaluate(expr) {
    const res = await pageSend('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result ? res.result.value : undefined;
  }

  async function setViewport(width, height) {
    await pageSend('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600
    });
    await pageSend('Emulation.setVisibleSize', { width, height });
  }

  async function captureScreenshot(filepath) {
    const res = await pageSend('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
  }

  await pageSend('Page.enable');
  await pageSend('Runtime.enable');

  let allPassed = true;
  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      allPassed = false;
    }
  }

  // ==========================================
  // TEST 1: BLOG PAGE SEARCH AREA ALIGNMENT
  // ==========================================
  console.log('--- 1. Testing Blog Page Search Area Alignment (Desktop 1280x900) ---');
  await setViewport(1280, 900);
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog.html' });
  await sleep(1500);

  const desktopAlignment = await evaluate(`
    (() => {
      const hero = document.querySelector('.inner-page-hero');
      const section = document.querySelector('.filter-toolbar-section');
      const form = document.getElementById('blog-search-form');
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const cats = document.querySelector('.blog-filter-categories');

      const heroRect = hero ? hero.getBoundingClientRect() : {};
      const secRect = section ? section.getBoundingClientRect() : {};
      const formRect = form ? form.getBoundingClientRect() : {};
      const inputRect = input ? input.getBoundingClientRect() : {};
      const btnRect = btn ? btn.getBoundingClientRect() : {};
      const catsRect = cats ? cats.getBoundingClientRect() : {};

      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;

      return {
        inputTop: inputRect.top,
        btnTop: btnRect.top,
        inputHeight: inputRect.height,
        btnHeight: btnRect.height,
        sameRow: Math.abs(inputRect.top - btnRect.top) < 2,
        heightMatch: Math.abs(inputRect.height - btnRect.height) < 2,
        heroGap: secRect.top - heroRect.bottom,
        catsGap: catsRect.top - formRect.bottom,
        toolbarSameRow: Math.abs(formRect.top - catsRect.top) < 15,
        hasOverflow
      };
    })()
  `);

  console.log('Desktop Alignment Metrics:', desktopAlignment);
  assert(desktopAlignment.sameRow, 'Search input and Search button are on the same horizontal row');
  assert(desktopAlignment.heightMatch, `Search input (${desktopAlignment.inputHeight}px) and button (${desktopAlignment.btnHeight}px) have matching height`);
  assert(desktopAlignment.heroGap >= 0, 'Search toolbar section does not touch or overlap hero image');
  assert(desktopAlignment.toolbarSameRow, 'Search form and category tabs align on same row on desktop (matching Services page)');
  assert(!desktopAlignment.hasOverflow, 'Zero horizontal overflow on desktop');

  await captureScreenshot(path.join(ARTIFACTS_DIR, 'verified-blog-search-desktop.png'));

  // Tablet Viewport (768x1024)
  console.log('\n--- 2. Testing Blog Page Search Area Alignment (Tablet 768x1024) ---');
  await setViewport(768, 1024);
  await sleep(500);

  const tabletAlignment = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const form = document.getElementById('blog-search-form');
      const cats = document.querySelector('.blog-filter-categories');
      const inputRect = input.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      const catsRect = cats.getBoundingClientRect();
      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        sameRow: Math.abs(inputRect.top - btnRect.top) < 2,
        heightMatch: Math.abs(inputRect.height - btnRect.height) < 2,
        stacked: catsRect.top > formRect.bottom,
        gapBetween: catsRect.top - formRect.bottom,
        hasOverflow
      };
    })()
  `);
  console.log('Tablet Alignment Metrics:', tabletAlignment);
  assert(tabletAlignment.sameRow, 'Search input and button remain on same row on tablet');
  assert(tabletAlignment.heightMatch, 'Search input and button have matching height on tablet');
  assert(tabletAlignment.stacked && tabletAlignment.gapBetween >= 16, `Search and categories cleanly stack with ${tabletAlignment.gapBetween}px gap`);
  assert(!tabletAlignment.hasOverflow, 'Zero horizontal overflow on tablet');

  await captureScreenshot(path.join(ARTIFACTS_DIR, 'verified-blog-search-tablet.png'));

  // Mobile Viewport (375x812)
  console.log('\n--- 3. Testing Blog Page Search Area Alignment (Mobile 375x812) ---');
  await setViewport(375, 812);
  await sleep(500);

  const mobileAlignment = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const form = document.getElementById('blog-search-form');
      const cats = document.querySelector('.blog-filter-categories');
      const inputRect = input.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      const catsRect = cats.getBoundingClientRect();
      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        sameRow: Math.abs(inputRect.top - btnRect.top) < 2,
        heightMatch: Math.abs(inputRect.height - btnRect.height) < 2,
        stacked: catsRect.top > formRect.bottom,
        gapBetween: catsRect.top - formRect.bottom,
        hasOverflow
      };
    })()
  `);
  console.log('Mobile Alignment Metrics:', mobileAlignment);
  assert(mobileAlignment.sameRow, 'Search input and button remain on same row on mobile');
  assert(mobileAlignment.heightMatch, 'Search input and button have matching height on mobile');
  assert(mobileAlignment.stacked && mobileAlignment.gapBetween >= 16, `Search and categories cleanly stack with ${mobileAlignment.gapBetween}px gap`);
  assert(!mobileAlignment.hasOverflow, 'Zero horizontal overflow on mobile');

  await captureScreenshot(path.join(ARTIFACTS_DIR, 'verified-blog-search-mobile.png'));

  // ==========================================
  // TEST 2: BLOG PAGE SEARCH FUNCTIONALITY
  // ==========================================
  console.log('\n--- 4. Testing Blog Search Functionality (Search Button & Enter Key) ---');
  await setViewport(1280, 900);
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog.html' });
  await sleep(1000);

  // Test 2a: Search by clicking Search button
  const searchBtnResult = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      input.value = 'deadbolt';
      btn.click();
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      return {
        count: visible.length,
        firstTitle: visible[0] ? visible[0].querySelector('.blog-title').textContent.trim() : ''
      };
    })()
  `);
  console.log('Search "deadbolt" via button click:', searchBtnResult);
  assert(searchBtnResult.count > 0, `Search button filtered articles (found ${searchBtnResult.count} matching articles)`);

  // Test 2b: Search nonexistent keyword shows clean "No articles found" message
  const noResultTest = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      input.value = 'nonexistentxyz999';
      btn.click();
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      const noRes = document.getElementById('blog-no-results');
      return {
        visibleCount: visible.length,
        noResultsVisible: noRes ? noRes.style.display !== 'none' : false,
        noResultsText: noRes ? noRes.querySelector('h3').textContent : ''
      };
    })()
  `);
  console.log('Search "nonexistentxyz999":', noResultTest);
  assert(noResultTest.visibleCount === 0 && noResultTest.noResultsVisible, 'Shows clean "No articles found" message when nothing matches');

  // Test 2c: Reset Search button restores all articles
  const resetResult = await evaluate(`
    (() => {
      const resetBtn = document.getElementById('blog-reset-filter-btn');
      resetBtn.click();
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      const input = document.getElementById('blog-search-input');
      return {
        visibleCount: visible.length,
        inputCleared: input.value === ''
      };
    })()
  `);
  console.log('Reset Search Button Clicked:', resetResult);
  assert(resetResult.visibleCount === 6 && resetResult.inputCleared, 'Reset button restored all 6 articles and cleared input');

  // Test 2d: Search by pressing Enter key
  const enterKeyResult = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      input.value = 'transponder';
      const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
      input.dispatchEvent(event);
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      return {
        count: visible.length,
        title: visible[0] ? visible[0].querySelector('.blog-title').textContent.trim() : ''
      };
    })()
  `);
  console.log('Search "transponder" via Enter key:', enterKeyResult);
  assert(enterKeyResult.count >= 1 && enterKeyResult.title.includes('Car Key'), 'Pressing Enter successfully searches and displays Automotive car key article');

  // Test 2e: Search when category tab is active automatically falls back to all if needed
  const categoryFallbackResult = await evaluate(`
    (() => {
      // First click Commercial tab
      const commBtn = document.querySelector('.js-blog-filter-btn[data-filter="Commercial"]');
      commBtn.click();
      // Now search for "deadbolt" which is in Home Security
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      input.value = 'deadbolt';
      btn.click();
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      const activeBtn = document.querySelector('.js-blog-filter-btn.active');
      return {
        count: visible.length,
        activeTab: activeBtn ? activeBtn.getAttribute('data-filter') : ''
      };
    })()
  `);
  console.log('Category fallback on search result:', categoryFallbackResult);
  assert(categoryFallbackResult.count > 0 && categoryFallbackResult.activeTab === 'all', 'Automatically falls back to All Articles so search term is found across categories');

  // ==========================================
  // TEST 3: BLOG DETAILS SIDEBAR SEARCH & CATEGORIES
  // ==========================================
  console.log('\n--- 5. Testing Blog Details Page Sidebar Widgets (Search & Categories) ---');
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog-details.html?id=1' });
  await sleep(1500);

  const sidebarMetrics = await evaluate(`
    (() => {
      const form = document.getElementById('sidebar-search-form');
      const input = document.getElementById('sidebar-search-input');
      const btn = document.getElementById('sidebar-search-btn');
      const catsList = document.getElementById('sidebar-categories-list');
      const heroMedia = document.querySelector('.blog-article-hero-media');
      const heroImg = document.querySelector('.blog-article-hero-img');
      const stickyNavbar = document.querySelector('.site-header, .sticky-navbar');
      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;

      const iRect = input ? input.getBoundingClientRect() : {};
      const bRect = btn ? btn.getBoundingClientRect() : {};
      const hRect = heroMedia ? heroMedia.getBoundingClientRect() : {};

      const catLinks = Array.from(catsList ? catsList.querySelectorAll('a') : []).map(a => ({
        text: a.textContent.replace(/\\s+/g, ' ').trim(),
        href: a.getAttribute('href')
      }));

      const navStyle = stickyNavbar ? window.getComputedStyle(stickyNavbar) : {};

      return {
        hasSearchForm: !!form,
        hasSearchInput: !!input,
        hasSearchBtn: !!btn,
        searchSameRow: Math.abs(iRect.top - bRect.top) < 3,
        searchHeightMatch: Math.abs(iRect.height - bRect.height) < 2,
        catCount: catLinks.length,
        catLinks,
        heroMediaHeight: hRect.height,
        heroMediaContained: hRect.height <= 420,
        navbarPosition: navStyle.position,
        navbarTop: navStyle.top,
        hasOverflow
      };
    })()
  `);

  console.log('Blog Details Sidebar Metrics:', sidebarMetrics);
  assert(sidebarMetrics.hasSearchForm && sidebarMetrics.hasSearchInput && sidebarMetrics.hasSearchBtn, 'Sidebar search form, input, and button all exist');
  assert(sidebarMetrics.searchSameRow, 'Sidebar search input and Search button are aligned on same row');
  assert(sidebarMetrics.searchHeightMatch, 'Sidebar search input and button have matching height');
  assert(sidebarMetrics.catCount === 6, 'Sidebar categories widget has all 6 valid categories');
  assert(sidebarMetrics.catLinks.every(c => c.text.includes('(1)')), 'Category counts strictly reflect actual articles (1 article each)');
  assert(sidebarMetrics.heroMediaContained, `Article hero image properly sized and contained (height: ${sidebarMetrics.heroMediaHeight}px <= 420px)`);
  assert(sidebarMetrics.navbarPosition === 'sticky' && sidebarMetrics.navbarTop === '0px', 'Navbar is sticky at top: 0');
  assert(!sidebarMetrics.hasOverflow, 'Zero horizontal overflow on blog details desktop');

  await captureScreenshot(path.join(ARTIFACTS_DIR, 'verified-blog-details-desktop.png'));

  // Test 3b: Sidebar Search submission redirects to blog.html with query
  console.log('\n--- 6. Testing Sidebar Search Action Navigation ---');
  await evaluate(`
    (() => {
      const input = document.getElementById('sidebar-search-input');
      const form = document.getElementById('sidebar-search-form');
      input.value = 'rekey';
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    })()
  `);
  await sleep(1500);

  const navigatedSearchState = await evaluate(`
    (() => {
      const url = window.location.href;
      const input = document.getElementById('blog-search-input');
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      return {
        url,
        inputValue: input ? input.value : '',
        visibleCount: visible.length,
        articleTitle: visible[0] ? visible[0].querySelector('.blog-title').textContent.trim() : ''
      };
    })()
  `);
  console.log('After Sidebar Search Navigation:', navigatedSearchState);
  assert(navigatedSearchState.url.includes('blog.html?q=rekey'), 'Navigated to blog.html?q=rekey');
  assert(navigatedSearchState.inputValue === 'rekey', 'Search input is pre-populated with "rekey"');
  assert(navigatedSearchState.visibleCount >= 1 && navigatedSearchState.articleTitle.includes('Rekey'), 'Rekey article correctly filtered and displayed');

  // Test 3c: Sidebar Category Link navigation filters blog by category
  console.log('\n--- 7. Testing Sidebar Category Link Navigation ---');
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog-details.html?id=1' });
  await sleep(1500);

  await evaluate(`
    (() => {
      const smartTechLink = Array.from(document.querySelectorAll('#sidebar-categories-list a')).find(a => a.textContent.includes('Smart Tech'));
      if (smartTechLink) smartTechLink.click();
    })()
  `);
  await sleep(1500);

  const navigatedCatState = await evaluate(`
    (() => {
      const url = window.location.href;
      const activeBtn = document.querySelector('.js-blog-filter-btn.active');
      const visible = Array.from(document.querySelectorAll('.js-blog-item')).filter(c => c.style.display !== 'none');
      return {
        url,
        activeCategory: activeBtn ? activeBtn.getAttribute('data-filter') : '',
        visibleCount: visible.length,
        articleCategory: visible[0] ? visible[0].getAttribute('data-category') : ''
      };
    })()
  `);
  console.log('After Sidebar Category Click Navigation:', navigatedCatState);
  assert(navigatedCatState.url.includes('blog.html?category=Smart%20Tech'), 'Navigated to blog.html?category=Smart%20Tech');
  assert(navigatedCatState.activeCategory === 'Smart Tech', 'Smart Tech category button marked active');
  assert(navigatedCatState.visibleCount === 1 && navigatedCatState.articleCategory === 'Smart Tech', 'Filtered exclusively to Smart Tech article');

  // Test 3d: Responsive Blog Details (Mobile 375x812)
  console.log('\n--- 8. Testing Blog Details Responsive Layout (Mobile 375x812) ---');
  await setViewport(375, 812);
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog-details.html?id=1' });
  await sleep(1500);

  const blogDetailsMobile = await evaluate(`
    (() => {
      const article = document.querySelector('.blog-article-full');
      const sidebar = document.querySelector('.blog-sidebar');
      const aRect = article ? article.getBoundingClientRect() : {};
      const sRect = sidebar ? sidebar.getBoundingClientRect() : {};
      const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        stacked: sRect.top >= aRect.bottom - 10,
        gapBetween: sRect.top - aRect.bottom,
        hasOverflow
      };
    })()
  `);
  console.log('Blog Details Mobile Layout:', blogDetailsMobile);
  assert(blogDetailsMobile.stacked, 'Sidebar cleanly stacks below article content on mobile');
  assert(!blogDetailsMobile.hasOverflow, 'Zero horizontal overflow on blog details mobile');

  await captureScreenshot(path.join(ARTIFACTS_DIR, 'verified-blog-details-mobile.png'));

  console.log('\n==================================================');
  if (allPassed) {
    console.log('SUMMARY: ALL TESTS PASSED! ZERO FAILURES.');
  } else {
    console.error('SUMMARY: SOME TESTS FAILED. PLEASE REVIEW LOG ABOVE.');
  }
  console.log('==================================================\n');

  ws.close();
  chrome.kill();
  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
