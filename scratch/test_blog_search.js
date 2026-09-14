const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome-data-full');

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

  await pageSend('Page.enable');
  await pageSend('Runtime.enable');

  await pageSend('Page.navigate', { url: 'http://127.0.0.1:8080/blog.html' });
  await sleep(1500);

  console.log('Testing Blog Search Button Click...');
  const searchTestResult = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const cards = document.querySelectorAll('.js-blog-item');
      
      input.value = 'deadbolt';
      // simulate button click
      btn.click();
      
      const visible = Array.from(cards).filter(c => c.style.display !== 'none');
      return {
        inputValue: input.value,
        totalCards: cards.length,
        visibleCards: visible.length,
        visibleTitles: visible.map(c => c.querySelector('.blog-title').textContent.trim())
      };
    })()
  `);
  console.log('Search Result for "deadbolt":', searchTestResult);

  const searchTestNonexistent = await evaluate(`
    (() => {
      const input = document.getElementById('blog-search-input');
      const btn = document.getElementById('blog-search-btn');
      const cards = document.querySelectorAll('.js-blog-item');
      const noResults = document.getElementById('blog-no-results');
      
      input.value = 'nonexistentxyz123';
      btn.click();
      
      const visible = Array.from(cards).filter(c => c.style.display !== 'none');
      return {
        inputValue: input.value,
        visibleCards: visible.length,
        noResultsDisplay: noResults ? noResults.style.display : 'not found'
      };
    })()
  `);
  console.log('Search Result for "nonexistentxyz123":', searchTestNonexistent);

  ws.close();
  chrome.kill();
}

main().catch(console.error);
