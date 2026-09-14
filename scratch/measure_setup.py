import subprocess, json, os

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
html_url = "file:///" + os.path.abspath("home-2.html").replace("\\", "/")

# Use node or chrome to dump bounding client rects
# We can inject a tiny script into home-2.html or run via a temp script
script = """
const items = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(el => {
  const r = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  return {
    text: el.innerText.trim().replace('\\n', ' '),
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    paddingLeft: cs.paddingLeft,
    paddingRight: cs.paddingRight,
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight
  };
});
const menuRect = document.querySelector('.nav-menu').getBoundingClientRect();
const navbarRect = document.querySelector('.navbar').getBoundingClientRect();
const logoRect = document.querySelector('.brand-logo').getBoundingClientRect();
const actionsRect = document.querySelector('.header-actions').getBoundingClientRect();

console.log(JSON.stringify({
  navbar: navbarRect,
  logo: logoRect,
  actions: actionsRect,
  menu: menuRect,
  items: items
}, null, 2));
"""

with open("scratch/measure.js", "w", encoding="utf-8") as f:
    f.write(script)

# We can run node with jsdom or chrome with console output
cmd = [
    chrome_path,
    "--headless=new",
    "--window-size=1440,900",
    "--run-all-compositor-stages-before-draw",
    f"--virtual-time-budget=1000",
    html_url
]
print("Measuring setup complete")
