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

  await pageSend('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/service-details.html?service=emergency-lockout' });
  await sleep(1500);

  // Full page screenshot
  const metrics = await pageSend('Page.getLayoutMetrics');
  const height = Math.ceil(metrics.contentSize.height);
  await pageSend('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: height,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(500);

  const res = await pageSend('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const outPath = path.join(ARTIFACTS_DIR, 'debug-service-details-full.png');
  fs.writeFileSync(outPath, buffer);
  console.log('Saved debug-service-details-full.png');

  // Also full page screenshot of about.html
  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/about.html' });
  await sleep(1500);
  const aboutMetrics = await pageSend('Page.getLayoutMetrics');
  const aboutHeight = Math.ceil(aboutMetrics.contentSize.height);
  await pageSend('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: aboutHeight,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(500);

  const aboutRes = await pageSend('Page.captureScreenshot', { format: 'png' });
  const aboutBuffer = Buffer.from(aboutRes.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'debug-about-full.png'), aboutBuffer);
  console.log('Saved debug-about-full.png');

  await send('Target.closeTarget', { targetId });
  pageWs.close();
  ws.close();
  chrome.kill();
}

run().catch(console.error);
