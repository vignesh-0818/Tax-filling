const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome-data-full');
const ARTIFACTS_DIR = path.resolve(__dirname, '..');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== VERIFYING BLOG PAGE HOME SECURITY CARD REMOVAL & ALIGNMENT ===\n');

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
    console.error('Failed to connect to Chrome debugger');
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

  await new Promise(resolve => ws.onopen = resolve);

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.targetId;
  const pageRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await pageRes.json();
  const pageWsUrl = pages.find(p => p.id === targetId)?.webSocketDebuggerUrl;

  const pageWs = new WebSocket(pageWsUrl);
  await new Promise(resolve => pageWs.onopen = resolve);

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

  await pageSend('Page.enable');
  await pageSend('Runtime.enable');
  await pageSend('DOM.enable');

  async function navigate(url, width = 1280, height = 900) {
    await pageSend('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await pageSend('Page.navigate', { url });
    await sleep(1300);
  }

  async function evaluate(expression) {
    const res = await pageSend('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async function captureScreenshot(filename) {
    const res = await pageSend('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. DESKTOP VERIFICATION (1280x900)
  console.log('--- 1. Desktop Verification (1280x900) ---');
  await navigate('http://127.0.0.1:8080/blog.html', 1280, 900);

  const desktopData = await evaluate(`
    (() => {
      const featuredCard = document.querySelector('.featured-blog-card');
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      const homeSecurityCards = cards.filter(c => {
        const cat = c.getAttribute('data-category') || '';
        return cat.toLowerCase().includes('home security');
      });

      const categories = cards.map(c => (c.querySelector('.blog-card-category')?.textContent || '').trim());
      const titles = cards.map(c => (c.querySelector('.blog-title')?.textContent || '').trim());

      const grid = document.getElementById('blog-grid-container');
      const gridStyles = grid ? window.getComputedStyle(grid) : null;
      const gridTemplateCols = gridStyles ? gridStyles.gridTemplateColumns.split(' ').length : 0;

      const cardRects = cards.map(c => {
        const r = c.getBoundingClientRect();
        return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
      });

      // Row 1 tops should match, Row 2 tops should match
      const row1Tops = cardRects.slice(0, 3).map(r => r.top);
      const row2Tops = cardRects.slice(3, 6).map(r => r.top);
      const row1Aligned = Math.max(...row1Tops) - Math.min(...row1Tops) <= 2;
      const row2Aligned = Math.max(...row2Tops) - Math.min(...row2Tops) <= 2;

      // Column lefts should match: col 0 (0, 3), col 1 (1, 4), col 2 (2, 5)
      const col0Aligned = Math.abs(cardRects[0].left - cardRects[3].left) <= 2;
      const col1Aligned = Math.abs(cardRects[1].left - cardRects[4].left) <= 2;
      const col2Aligned = Math.abs(cardRects[2].left - cardRects[5].left) <= 2;

      return {
        featuredCardExists: !!featuredCard,
        totalCardCount: cards.length,
        homeSecurityCardCount: homeSecurityCards.length,
        categories,
        titles,
        gridTemplateCols,
        cardRects,
        row1Aligned,
        row2Aligned,
        col0Aligned,
        col1Aligned,
        col2Aligned,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);

  console.log('Featured card exists (should be false):', desktopData.featuredCardExists);
  console.log('Total card count (should be 6):', desktopData.totalCardCount);
  console.log('Home Security card count (should be 1):', desktopData.homeSecurityCardCount);
  console.log('Categories list:', desktopData.categories);
  console.log('Grid columns count:', desktopData.gridTemplateCols);
  console.log('Row 1 top alignment:', desktopData.row1Aligned);
  console.log('Row 2 top alignment:', desktopData.row2Aligned);
  console.log('Columns alignment (0, 1, 2):', desktopData.col0Aligned, desktopData.col1Aligned, desktopData.col2Aligned);
  console.log('Horizontal overflow:', desktopData.hasHorizontalOverflow);

  await captureScreenshot('blog-cards-desktop.png');

  // Test filter interaction
  console.log('\n--- Filter Interaction Test ---');
  const filterTest = await evaluate(`
    (() => {
      const hsBtn = document.querySelector('.js-blog-filter-btn[data-filter="Home Security"]');
      if (hsBtn) hsBtn.click();

      const visibleAfterHs = Array.from(document.querySelectorAll('.blog-card')).filter(c => window.getComputedStyle(c).display !== 'none');
      const hsCategory = visibleAfterHs.map(c => c.getAttribute('data-category'));

      const allBtn = document.querySelector('.js-blog-filter-btn[data-filter="all"]');
      if (allBtn) allBtn.click();
      const visibleAfterAll = Array.from(document.querySelectorAll('.blog-card')).filter(c => window.getComputedStyle(c).display !== 'none');

      return {
        hsVisibleCount: visibleAfterHs.length,
        hsCategory,
        allVisibleCount: visibleAfterAll.length
      };
    })()
  `);
  console.log('Filter test:', filterTest);

  // 2. TABLET VERIFICATION (768x1024)
  console.log('\n--- 2. Tablet Verification (768x1024) ---');
  await navigate('http://127.0.0.1:8080/blog.html', 768, 1024);
  const tabletData = await evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      return {
        totalCards: cards.length,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Tablet evaluation:', tabletData);
  await captureScreenshot('blog-cards-tablet.png');

  // 3. MOBILE VERIFICATION (375x812)
  console.log('\n--- 3. Mobile Verification (375x812) ---');
  await navigate('http://127.0.0.1:8080/blog.html', 375, 812);
  const mobileData = await evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      return {
        totalCards: cards.length,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log('Mobile evaluation:', mobileData);
  await captureScreenshot('blog-cards-mobile.png');

  const allPass = !desktopData.featuredCardExists &&
    desktopData.totalCardCount === 6 &&
    desktopData.homeSecurityCardCount === 1 &&
    desktopData.row1Aligned &&
    desktopData.row2Aligned &&
    desktopData.col0Aligned &&
    desktopData.col1Aligned &&
    desktopData.col2Aligned &&
    !desktopData.hasHorizontalOverflow &&
    !tabletData.hasHorizontalOverflow &&
    !mobileData.hasHorizontalOverflow &&
    filterTest.hsVisibleCount === 1 &&
    filterTest.allVisibleCount === 6;

  console.log('\n==========================================');
  console.log('OVERALL TEST RESULT:', allPass ? 'ALL TESTS PASSED' : 'TESTS FAILED');
  console.log('==========================================');

  await send('Target.closeTarget', { targetId });
  pageWs.close();
  ws.close();
  chrome.kill();
  process.exit(allPass ? 0 : 1);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
