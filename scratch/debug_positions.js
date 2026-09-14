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
    await sleep(1500);
  }

  async function captureScreenshot(filename) {
    const res = await pageSend('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename}`);
  }

  await navigate('http://127.0.0.1:8080/about.html', 1280, 900);
  await captureScreenshot('debug-about-desktop.png');

  await navigate('http://127.0.0.1:8080/service-details.html?service=emergency-lockout', 1280, 1200);
  await captureScreenshot('debug-service-details-top.png');

  // Also evaluate positions on service-details.html
  const sdDebug = await pageSend('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.service-detail-hero .btn-emergency');
      const heroContent = document.querySelector('.service-detail-hero');
      const statStrip = document.querySelector('.service-detail-hero .bg-surface');
      const img = document.querySelector('.service-detail-media');
      const bRect = btn ? btn.getBoundingClientRect() : null;
      const sRect = statStrip ? statStrip.getBoundingClientRect() : null;
      const iRect = img ? img.getBoundingClientRect() : null;
      return { bRect, sRect, iRect };
    })()`,
    returnByValue: true
  });
  console.log('Service details hero button debug:', sdDebug.result.value);

  // About page button debug
  await navigate('http://127.0.0.1:8080/about.html', 1280, 900);
  const aboutDebug = await pageSend('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button, a.btn')).filter(b => b.textContent.includes('Request a Locksmith'));
      return btns.map(b => {
        const r = b.getBoundingClientRect();
        const prev = b.parentElement.previousElementSibling;
        const prevR = prev ? prev.getBoundingClientRect() : null;
        return { text: b.textContent.trim(), rect: r, prevRect: prevR };
      });
    })()`,
    returnByValue: true
  });
  console.log('About page button debug:', aboutDebug.result.value);

  await send('Target.closeTarget', { targetId });
  pageWs.close();
  ws.close();
  chrome.kill();
}

run().catch(console.error);
