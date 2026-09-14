import subprocess, os, re, json

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with open("home-2.html", "r", encoding="utf-8") as f:
    content = f.read()

snippet = """
<script>
window.addEventListener('load', () => {
  const items = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(el => {
    const r = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    return {
      text: el.innerText.trim().replace(/\\s+/g, ' '),
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      pl: cs.paddingLeft,
      pr: cs.paddingRight,
      lh: cs.lineHeight
    };
  });
  const menu = document.querySelector('.nav-menu').getBoundingClientRect();
  const nav = document.querySelector('.navbar').getBoundingClientRect();
  const logo = document.querySelector('.brand-logo').getBoundingClientRect();
  const act = document.querySelector('.header-actions').getBoundingClientRect();
  
  const res = {
    nav_left: Math.round(nav.left * 10) / 10,
    nav_w: Math.round(nav.width * 10) / 10,
    logo_w: Math.round(logo.width * 10) / 10,
    logo_right: Math.round(logo.right * 10) / 10,
    menu_left: Math.round(menu.left * 10) / 10,
    menu_right: Math.round(menu.right * 10) / 10,
    menu_w: Math.round(menu.width * 10) / 10,
    actions_left: Math.round(act.left * 10) / 10,
    actions_w: Math.round(act.width * 10) / 10,
    gap_logo_menu: Math.round((menu.left - logo.right) * 10) / 10,
    gap_menu_actions: Math.round((act.left - menu.right) * 10) / 10,
    items: items
  };
  const div = document.createElement('div');
  div.id = 'measure-result';
  div.textContent = JSON.stringify(res);
  document.body.appendChild(div);
});
</script>
"""

test_html = os.path.abspath("test_measure.html")
with open(test_html, "w", encoding="utf-8") as f:
    f.write(content.replace("</body>", snippet + "</body>"))

res = subprocess.run([
    chrome_path,
    "--headless=new",
    "--window-size=1440,900",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=1000",
    "--dump-dom",
    "file:///" + test_html.replace("\\", "/")
], capture_output=True, text=True)

if os.path.exists(test_html):
    os.remove(test_html)

match = re.search(r'<div id="measure-result">(.*?)</div>', res.stdout, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    print(json.dumps(data, indent=2))
else:
    print("Not found in dump-dom. Length of stdout:", len(res.stdout))
