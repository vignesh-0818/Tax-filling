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
  console.log('=== VERIFYING ABOUT PAGE & SERVICE DETAILS PAGE ALIGNMENT FIXES ===\n');

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
    await sleep(1400);
  }

  async function evaluate(expression) {
    const res = await pageSend('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async function captureFullPageScreenshot(filename, width = 1280) {
    const metrics = await pageSend('Page.getLayoutMetrics');
    const height = Math.ceil(metrics.contentSize.height);
    await pageSend('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await sleep(400);
    const res = await pageSend('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename} (${width}x${height})`);
  }

  let allPass = true;

  // 1. ABOUT PAGE TESTS
  console.log('--- 1. ABOUT PAGE VERIFICATION ---');
  for (const vp of [{ name: 'Desktop', w: 1280, h: 900 }, { name: 'Tablet', w: 768, h: 1024 }, { name: 'Mobile', w: 375, h: 812 }]) {
    await navigate('http://127.0.0.1:8080/about.html', vp.w, vp.h);
    const aboutData = await evaluate(`
      (() => {
        const stats = document.querySelector('.about-stats-strip');
        const actions = document.querySelector('.about-actions');
        const btn = actions ? actions.querySelector('.btn-primary') : null;
        if (!stats || !actions || !btn) return { error: 'Elements missing' };

        const statsRect = stats.getBoundingClientRect();
        const actionsRect = actions.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        // Check if button sits cleanly below stats
        const gap = actionsRect.top - statsRect.bottom;
        const noOverlap = actionsRect.top >= statsRect.bottom;

        return {
          statsHeight: statsRect.height,
          actionsHeight: actionsRect.height,
          gap,
          noOverlap,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()
    `);

    console.log(`[About ${vp.name}] gap: ${aboutData.gap}px, noOverlap: ${aboutData.noOverlap}, overflow: ${aboutData.hasHorizontalOverflow}`);
    if (!aboutData.noOverlap || aboutData.gap < 15 || aboutData.hasHorizontalOverflow) {
      allPass = false;
      console.error(`About page failed on ${vp.name}`);
    }

    await captureFullPageScreenshot(`verified-about-${vp.name.toLowerCase()}.png`, vp.w);
  }

  // 2. SERVICE DETAILS TESTS
  console.log('\n--- 2. SERVICE DETAILS PAGE VERIFICATION ---');
  for (const vp of [{ name: 'Desktop', w: 1280, h: 900 }, { name: 'Tablet', w: 768, h: 1024 }, { name: 'Mobile', w: 375, h: 812 }]) {
    await navigate('http://127.0.0.1:8080/service-details.html?service=emergency-lockout', vp.w, vp.h);

    const sdData = await evaluate(`
      (() => {
        // 1. Meta strip & Emergency Service button
        const title = document.querySelector('.service-detail-title');
        const metaStrip = document.querySelector('.service-meta-strip');
        const emergBtn = metaStrip ? metaStrip.querySelector('.btn-emergency') : null;
        const media = document.querySelector('.service-detail-media');

        const titleRect = title ? title.getBoundingClientRect() : null;
        const stripRect = metaStrip ? metaStrip.getBoundingClientRect() : null;
        const btnRect = emergBtn ? emergBtn.getBoundingClientRect() : null;
        const mediaRect = media ? media.getBoundingClientRect() : null;

        const gapTitleToStrip = stripRect && titleRect ? stripRect.top - titleRect.bottom : 0;
        const gapStripToMedia = mediaRect && stripRect ? mediaRect.top - stripRect.bottom : 0;
        const btnInsideStrip = stripRect && btnRect ? (btnRect.top >= stripRect.top && btnRect.bottom <= stripRect.bottom + 2) : false;

        // 2. Key Benefits Grid
        const benefitsGrid = document.querySelector('.service-benefits-grid');
        const benefitCards = Array.from(document.querySelectorAll('.service-benefit-card'));
        const benefitRects = benefitCards.map(c => c.getBoundingClientRect());
        const benefitsGridColumns = benefitsGrid ? window.getComputedStyle(benefitsGrid).gridTemplateColumns.split(' ').length : 0;
        const benefitIcons = benefitCards.map(c => {
          const icon = c.querySelector('.service-benefit-icon');
          const text = c.querySelector('.service-benefit-text');
          const iR = icon ? icon.getBoundingClientRect() : null;
          const tR = text ? text.getBoundingClientRect() : null;
          return { iconWidth: iR ? iR.width : 0, aligned: iR && tR && Math.abs(iR.top - tR.top) <= 5 };
        });
        const allBenefitIconsAligned = benefitIcons.every(b => b.aligned && b.iconWidth >= 20);

        // 3. 4-Step Process Grid
        const processGrid = document.querySelector('.service-process-grid');
        const processCards = Array.from(document.querySelectorAll('.service-process-card'));
        const processCols = processGrid ? window.getComputedStyle(processGrid).gridTemplateColumns.split(' ').length : 0;
        const processCardsRects = processCards.map(c => c.getBoundingClientRect());
        const processEqualRowHeights = processCards.length === 4;

        // 4. Transparent Pricing Cards
        const pricingGrid = document.querySelector('.service-pricing-grid');
        const pricingCards = Array.from(document.querySelectorAll('.service-pricing-card'));
        const pricingCols = pricingGrid ? window.getComputedStyle(pricingGrid).gridTemplateColumns.split(' ').length : 0;
        const pricingHeights = pricingCards.map(c => Math.round(c.getBoundingClientRect().height));
        const pricingButtons = pricingCards.map(c => Math.round(c.querySelector('.service-pricing-btn').getBoundingClientRect().top));
        const pricingHeightsEqual = Math.max(...pricingHeights) - Math.min(...pricingHeights) <= 2;
        const pricingButtonsEqual = Math.max(...pricingButtons) - Math.min(...pricingButtons) <= 2;

        // 5. FAQ Section
        const accordion = document.querySelector('.accordion');
        const faqItems = Array.from(document.querySelectorAll('.accordion-item'));
        const openFaq = document.querySelector('.accordion-item.open');
        const openBody = openFaq ? openFaq.querySelector('.accordion-body') : null;
        const openBodyRect = openBody ? openBody.getBoundingClientRect() : null;
        const openItemRect = openFaq ? openFaq.getBoundingClientRect() : null;
        const faqContained = openItemRect && openBodyRect ? openBodyRect.bottom <= openItemRect.bottom + 2 : false;

        // Gap from pricing to FAQ
        const faqRect = accordion ? accordion.getBoundingClientRect() : null;
        const pricingRect = pricingGrid ? pricingGrid.getBoundingClientRect() : null;
        const gapPricingToFaq = faqRect && pricingRect ? faqRect.top - pricingRect.bottom : 0;

        return {
          gapTitleToStrip,
          gapStripToMedia,
          btnInsideStrip,
          benefitsCount: benefitCards.length,
          benefitsGridColumns,
          allBenefitIconsAligned,
          processCount: processCards.length,
          processCols,
          pricingCount: pricingCards.length,
          pricingCols,
          pricingHeightsEqual,
          pricingButtonsEqual,
          pricingHeights,
          pricingButtons,
          gapPricingToFaq,
          faqContained,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()
    `);

    console.log(`\n[Service Details ${vp.name}]:`);
    console.log(`  Strip spacing: Title->Strip = ${sdData.gapTitleToStrip.toFixed(1)}px, Strip->Media = ${sdData.gapStripToMedia.toFixed(1)}px`);
    console.log(`  Emergency button cleanly inside strip: ${sdData.btnInsideStrip}`);
    console.log(`  Benefits: ${sdData.benefitsCount} cards, cols: ${sdData.benefitsGridColumns}, icons aligned: ${sdData.allBenefitIconsAligned}`);
    console.log(`  Process: ${sdData.processCount} cards, cols: ${sdData.processCols}`);
    console.log(`  Pricing: ${sdData.pricingCount} cards, cols: ${sdData.pricingCols}, heights equal: ${sdData.pricingHeightsEqual}, buttons baseline equal: ${sdData.pricingButtonsEqual}`);
    console.log(`  Pricing->FAQ gap: ${sdData.gapPricingToFaq.toFixed(1)}px`);
    console.log(`  FAQ contained: ${sdData.faqContained}`);
    console.log(`  Horizontal overflow: ${sdData.hasHorizontalOverflow}`);

    if (vp.name === 'Desktop') {
      if (sdData.gapStripToMedia < 20 || !sdData.btnInsideStrip || !sdData.pricingHeightsEqual || !sdData.pricingButtonsEqual || !sdData.faqContained || sdData.hasHorizontalOverflow) {
        allPass = false;
        console.error('Service Details desktop checks failed!');
      }
    } else {
      if (sdData.hasHorizontalOverflow || !sdData.faqContained) {
        allPass = false;
        console.error(`Service Details ${vp.name} checks failed!`);
      }
    }

    await captureFullPageScreenshot(`verified-service-details-${vp.name.toLowerCase()}.png`, vp.w);
  }

  // Test FAQ accordion click toggle
  console.log('\n--- 3. FAQ ACCORDION INTERACTION TEST ---');
  await navigate('http://127.0.0.1:8080/service-details.html?service=emergency-lockout', 1280, 900);
  const faqInteraction = await evaluate(`
    (() => {
      const items = Array.from(document.querySelectorAll('.accordion-item'));
      if (items.length < 2) return { error: 'Not enough items' };

      // Click second header
      const header2 = items[1].querySelector('.accordion-header');
      header2.click();

      return {
        item1Open: items[0].classList.contains('open'),
        item2Open: items[1].classList.contains('open'),
        item2BodyDisplay: window.getComputedStyle(items[1].querySelector('.accordion-body')).display
      };
    })()
  `);
  console.log('FAQ interaction result:', faqInteraction);
  if (!faqInteraction.item2Open || faqInteraction.item2BodyDisplay !== 'block') {
    allPass = false;
    console.error('FAQ accordion interaction failed!');
  }

  console.log('\n==========================================');
  console.log('FINAL TEST RESULT:', allPass ? 'ALL TESTS PASSED 100%' : 'SOME TESTS FAILED');
  console.log('==========================================');

  await send('Target.closeTarget', { targetId });
  pageWs.close();
  ws.close();
  chrome.kill();
  process.exit(allPass ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
