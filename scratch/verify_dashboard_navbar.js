const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.id = 1;
        this.callbacks = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.id && this.callbacks.has(data.id)) {
                    const { resolve, reject } = this.callbacks.get(data.id);
                    this.callbacks.delete(data.id);
                    if (data.error) reject(data.error);
                    else resolve(data.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = this.id++;
            this.callbacks.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function startChrome() {
    const chrome = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--disable-gpu',
        '--no-sandbox',
        '--disable-extensions'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await sleep(400);
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
            const pages = await res.json();
            const targetPage = pages.find(p => p.type === 'page');
            if (targetPage && targetPage.webSocketDebuggerUrl) {
                wsUrl = targetPage.webSocketDebuggerUrl;
                break;
            }
        } catch (e) {}
    }

    if (!wsUrl) {
        chrome.kill();
        throw new Error("Could not connect to Chrome debugging port");
    }
    return { chrome, wsUrl };
}

async function evaluate(client, expression) {
    const res = await client.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
    });
    if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
}

async function navigateAndWait(client, url) {
    await client.send('Page.navigate', { url });
    for (let i = 0; i < 40; i++) {
        await sleep(250);
        try {
            const ready = await evaluate(client, `document.readyState === 'complete' && Boolean(document.querySelector('.navbar'))`);
            if (ready) break;
        } catch (e) {}
    }
    await sleep(200);
}

async function captureScreenshot(client, filepath) {
    const res = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
}

async function run() {
    console.log("=== STARTING TAXCORE DASHBOARD NAVBAR VERIFICATION ===");
    const { chrome, wsUrl } = await startChrome();
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');

    const testPages = [
        'index.html',
        'index-2.html',
        'about.html',
        'services.html',
        'pricing.html',
        'tax-calendar.html',
        'blog.html',
        'contact.html'
    ];

    try {
        // 1. Desktop Test for each page
        console.log("\n--- TEST 1: Desktop Viewport (1280x800) Check Across Pages ---");
        await client.send('Emulation.setDeviceMetricsOverride', {
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
            mobile: false
        });

        for (const page of testPages) {
            const pageUrl = `http://localhost:8080/${page}`;
            await navigateAndWait(client, pageUrl);

            const check = await evaluate(client, `(() => {
                const dash = document.getElementById('navDashboardBtn');
                const login = document.getElementById('navLoginBtn');
                const start = document.getElementById('navGetStartedBtn');
                const logout = document.getElementById('navLogoutBtn');
                const contact = document.querySelector('a.nav-link[href="contact.html"]');

                if (!dash) return { ok: false, error: 'Dashboard button missing' };
                const dashStyle = window.getComputedStyle(dash);
                const isDashVisible = dashStyle.display !== 'none' && dashStyle.visibility !== 'hidden' && dash.offsetWidth > 0;

                const dashRect = dash.getBoundingClientRect();
                const loginRect = login ? login.getBoundingClientRect() : null;
                const contactRect = contact ? contact.getBoundingClientRect() : null;

                return {
                    ok: isDashVisible,
                    href: dash.getAttribute('href'),
                    text: dash.textContent.trim(),
                    display: dashStyle.display,
                    dashX: Math.round(dashRect.left),
                    loginX: loginRect ? Math.round(loginRect.left) : null,
                    isBeforeLogin: loginRect ? dashRect.left < loginRect.left : true,
                    noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
                };
            })()`);

            console.log(`[${page}] Desktop Nav:`, JSON.stringify(check));
            if (!check.ok || !check.isBeforeLogin || check.href !== 'dashboard.html') {
                console.error(`FAILED on ${page}!`, check);
            }
        }

        // Capture Desktop Screenshot of index.html
        await navigateAndWait(client, 'http://localhost:8080/index.html');
        await captureScreenshot(client, path.join(__dirname, 'desktop_navbar.png'));
        console.log("Desktop screenshot saved: scratch/desktop_navbar.png");

        // 2. Mobile Viewport (390x844) Test
        console.log("\n--- TEST 2: Mobile Viewport (390x844) & Hamburger Menu Check ---");
        await client.send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true
        });

        for (const page of ['index.html', 'about.html', 'services.html', 'contact.html']) {
            await navigateAndWait(client, `http://localhost:8080/${page}`);

            // Click hamburger toggler
            const togglerClick = await evaluate(client, `(() => {
                const toggler = document.querySelector('.navbar-toggler');
                if (!toggler) return { ok: false, error: 'Navbar toggler missing' };
                toggler.click();
                return { ok: true };
            })()`);

            await sleep(500); // allow bootstrap collapse transition

            const mobileCheck = await evaluate(client, `(() => {
                const dash = document.getElementById('navDashboardBtn');
                const collapse = document.getElementById('mainNavbar');
                const toggler = document.querySelector('.navbar-toggler');

                if (!dash) return { ok: false, error: 'Dashboard button missing' };
                const dashStyle = window.getComputedStyle(dash);
                const isDashVisible = dashStyle.display !== 'none' && dash.offsetHeight > 0;
                const rect = dash.getBoundingClientRect();

                return {
                    ok: isDashVisible,
                    href: dash.getAttribute('href'),
                    text: dash.textContent.trim(),
                    isOpen: collapse ? collapse.classList.contains('show') : false,
                    rect: { x: Math.round(rect.left), y: Math.round(rect.top), w: Math.round(rect.width), h: Math.round(rect.height) },
                    noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
                };
            })()`);

            console.log(`[${page}] Mobile Nav Expanded:`, JSON.stringify(mobileCheck));
        }

        // Capture Mobile Screenshot
        await captureScreenshot(client, path.join(__dirname, 'mobile_navbar_expanded.png'));
        console.log("Mobile screenshot saved: scratch/mobile_navbar_expanded.png");

        // 3. Navigation Test: Click Dashboard link
        console.log("\n--- TEST 3: Click Dashboard Link Navigation ---");
        // Reset to desktop
        await client.send('Emulation.setDeviceMetricsOverride', {
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
            mobile: false
        });
        await navigateAndWait(client, 'http://localhost:8080/index.html');

        await evaluate(client, `(() => {
            const dash = document.getElementById('navDashboardBtn');
            dash.click();
        })()`);
        await sleep(800);

        const currentUrl = await evaluate(client, `window.location.href`);
        const pageTitle = await evaluate(client, `document.title`);
        const isDashboard = currentUrl.includes('dashboard.html') && !currentUrl.includes('admin-dashboard');
        console.log("Navigated URL:", currentUrl);
        console.log("Page Title:", pageTitle);
        console.log("Is Customer Dashboard?", isDashboard);

        // Capture Dashboard Screenshot
        await captureScreenshot(client, path.join(__dirname, 'dashboard_rendered.png'));
        console.log("Dashboard screenshot saved: scratch/dashboard_rendered.png");

        // 4. Authenticated State Test
        console.log("\n--- TEST 4: Logged-in Customer Navbar Check ---");
        await navigateAndWait(client, 'http://localhost:8080/index.html');

        // Set simulated login session
        await evaluate(client, `(() => {
            localStorage.setItem('currentUser', JSON.stringify({
                name: 'Vignesh R',
                email: 'customer@taxcore.com',
                role: 'customer'
            }));
            if (window.updatePublicNavbarAuth) window.updatePublicNavbarAuth();
        })()`);
        await sleep(300);

        const authCheck = await evaluate(client, `(() => {
            const dash = document.getElementById('navDashboardBtn');
            const login = document.getElementById('navLoginBtn');
            const start = document.getElementById('navGetStartedBtn');
            const logout = document.getElementById('navLogoutBtn');

            return {
                dashVisible: dash && window.getComputedStyle(dash).display !== 'none',
                loginHidden: login ? (window.getComputedStyle(login).display === 'none' || login.classList.contains('d-none')) : true,
                getStartedHidden: start ? (window.getComputedStyle(start).display === 'none' || start.classList.contains('d-none')) : true,
                logoutVisible: logout && window.getComputedStyle(logout).display !== 'none' && !logout.classList.contains('d-none'),
                dashHref: dash ? dash.getAttribute('href') : null
            };
        })()`);
        console.log("Auth State Result:", JSON.stringify(authCheck));

        // Capture Logged In Screenshot
        await captureScreenshot(client, path.join(__dirname, 'desktop_navbar_authenticated.png'));
        console.log("Authenticated screenshot saved: scratch/desktop_navbar_authenticated.png");

        // Clean up session
        await evaluate(client, `localStorage.removeItem('currentUser'); if (window.updatePublicNavbarAuth) window.updatePublicNavbarAuth();`);

        // 5. Theme and RTL test
        console.log("\n--- TEST 5: Theme and RTL Toggle Check ---");
        const themeToggleRes = await evaluate(client, `(() => {
            const themeBtn = document.querySelector('.theme-toggle-btn');
            const rtlBtn = document.querySelector('.rtl-toggle-btn');

            themeBtn.click();
            const isDark = document.body.classList.contains('dark-mode');

            rtlBtn.click();
            const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

            // Reset back
            themeBtn.click();
            rtlBtn.click();

            return { isDark, isRtl };
        })()`);
        console.log("Theme and RTL Toggle Result:", JSON.stringify(themeToggleRes));

    } finally {
        client.close();
        chrome.kill();
    }
}

run().catch(err => {
    console.error("Verification error:", err);
    process.exit(1);
});
