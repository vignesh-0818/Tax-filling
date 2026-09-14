const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome-data-full');
const ARTIFACTS_DIR = "C:\\Users\\vv356\\.gemini\\antigravity-ide\\brain\\a6015b53-60a6-4cc2-bfd3-2f3ac68d9e16";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
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
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.targetId;
  const pageRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await pageRes.json();
  const pageWsUrl = pages.find(p => p.id === targetId)?.webSocketDebuggerUrl;

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

  console.log('--- Inspecting Services Search Toolbar (Desktop) ---');
  await setViewport(1280, 900);
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/services.html' });
  await sleep(1500);

  const servicesSearchMetrics = await evaluate(`
    (() => {
      const section = document.querySelector('.filter-toolbar-section');
      const toolbar = document.querySelector('.services-filter-toolbar');
      const form = document.getElementById('service-search-form');
      const inputWrap = form.querySelector('.search-input-wrap');
      const input = document.getElementById('service-search-input');
      const btn = document.getElementById('service-search-btn');
      const cats = document.querySelector('.services-filter-categories');

      const sRect = section ? section.getBoundingClientRect() : {};
      const fRect = form ? form.getBoundingClientRect() : {};
      const iRect = input ? input.getBoundingClientRect() : {};
      const bRect = btn ? btn.getBoundingClientRect() : {};
      const cRect = cats ? cats.getBoundingClientRect() : {};

      return {
        sectionPaddingBlock: section ? window.getComputedStyle(section).paddingTop : '',
        formDisplay: form ? window.getComputedStyle(form).display : '',
        formFlexDirection: form ? window.getComputedStyle(form).flexDirection : '',
        formGap: form ? window.getComputedStyle(form).gap : '',
        inputTop: iRect.top,
        inputHeight: iRect.height,
        inputWidth: iRect.width,
        btnTop: bRect.top,
        btnHeight: bRect.height,
        btnWidth: bRect.width,
        sameRow: Math.abs(iRect.top - bRect.top) < 5,
        catsTop: cRect.top,
        formCatsSameRow: Math.abs(fRect.top - cRect.top) < 10
      };
    })()
  `);
  console.log('Services Search Metrics:', servicesSearchMetrics);
  await captureScreenshot(path.join(ARTIFACTS_DIR, 'debug-services-search-desktop.png'));

  console.log('\n--- Inspecting Blog Search Toolbar (Desktop) ---');
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog.html' });
  await sleep(1500);

  const blogSearchMetrics = await evaluate(`
    (() => {
      const section = document.querySelector('.filter-toolbar-section');
      const toolbar = document.querySelector('.blog-filter-toolbar');
      const form = document.getElementById('blog-search-form');
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const cats = document.querySelector('.blog-filter-categories');

      const sRect = section ? section.getBoundingClientRect() : {};
      const fRect = form ? form.getBoundingClientRect() : {};
      const iRect = input ? input.getBoundingClientRect() : {};
      const bRect = btn ? btn.getBoundingClientRect() : {};
      const cRect = cats ? cats.getBoundingClientRect() : {};

      return {
        sectionPaddingBlock: section ? window.getComputedStyle(section).paddingTop : '',
        toolbarDisplay: toolbar ? window.getComputedStyle(toolbar).display : '',
        toolbarFlexDirection: toolbar ? window.getComputedStyle(toolbar).flexDirection : '',
        toolbarGap: toolbar ? window.getComputedStyle(toolbar).gap : '',
        formDisplay: form ? window.getComputedStyle(form).display : '',
        formFlexDirection: form ? window.getComputedStyle(form).flexDirection : '',
        formGap: form ? window.getComputedStyle(form).gap : '',
        formWidth: fRect.width,
        inputTop: iRect.top,
        inputHeight: iRect.height,
        inputWidth: iRect.width,
        btnTop: bRect.top,
        btnHeight: bRect.height,
        btnWidth: bRect.width,
        sameRow: Math.abs(iRect.top - bRect.top) < 5,
        catsTop: cRect.top,
        formCatsSameRow: Math.abs(fRect.top - cRect.top) < 10
      };
    })()
  `);
  console.log('Blog Search Metrics (Desktop):', blogSearchMetrics);

  // Take screenshot of blog search area
  await captureScreenshot(path.join(ARTIFACTS_DIR, 'debug-blog-search-desktop.png'));

  console.log('\n--- Inspecting Blog Search Toolbar (Tablet 768px) ---');
  await setViewport(768, 1024);
  await sleep(500);
  const blogTabletMetrics = await evaluate(`
    (() => {
      const form = document.getElementById('blog-search-form');
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const cats = document.querySelector('.blog-filter-categories');
      const iRect = input.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      return {
        sameRow: Math.abs(iRect.top - bRect.top) < 5,
        inputHeight: iRect.height,
        btnHeight: bRect.height,
        btnTop: bRect.top,
        inputTop: iRect.top
      };
    })()
  `);
  console.log('Blog Tablet Metrics:', blogTabletMetrics);

  console.log('\n--- Inspecting Blog Search Toolbar (Mobile 375px) ---');
  await setViewport(375, 812);
  await sleep(500);
  const blogMobileMetrics = await evaluate(`
    (() => {
      const form = document.getElementById('blog-search-form');
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const iRect = input.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      return {
        formWidth: form.getBoundingClientRect().width,
        sameRow: Math.abs(iRect.top - bRect.top) < 5,
        inputTop: iRect.top,
        btnTop: bRect.top,
        inputHeight: iRect.height,
        btnHeight: bRect.height
      };
    })()
  `);
  console.log('Blog Mobile Metrics:', blogMobileMetrics);

  console.log('\n--- Inspecting Blog Details Sidebar (Desktop) ---');
  await setViewport(1280, 900);
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog-details.html?id=1' });
  await sleep(1500);

  const blogDetailsSidebarMetrics = await evaluate(`
    (() => {
      const sidebar = document.querySelector('.blog-sidebar');
      const searchCard = sidebar ? sidebar.querySelector('.blog-sidebar-card:nth-child(1)') : null;
      const catsCard = sidebar ? sidebar.querySelector('.blog-sidebar-card:nth-child(2)') : null;
      const searchInput = searchCard ? searchCard.querySelector('input') : null;
      const searchForm = searchCard ? searchCard.querySelector('form') : null;
      const searchBtn = searchCard ? searchCard.querySelector('button') : null;
      const catLinks = Array.from(catsCard ? catsCard.querySelectorAll('a') : []).map(a => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href')
      }));

      return {
        sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
        hasSearchBtn: !!searchBtn,
        searchFormAction: searchForm ? searchForm.getAttribute('action') : null,
        catLinks
      };
    })()
  `);
  console.log('Blog Details Sidebar:', blogDetailsSidebarMetrics);

  await captureScreenshot(path.join(ARTIFACTS_DIR, 'debug-blog-details-desktop.png'));

  ws.close();
  chrome.kill();
  console.log('\nInspection complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
