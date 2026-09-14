import subprocess, os, json, re

test_script = """
<script>
window.addEventListener('load', () => {
  const homeItem = document.querySelector('.nav-item');
  const dropdown = document.querySelector('.nav-dropdown');
  const ddStyle = window.getComputedStyle(dropdown);
  
  const initial = {
    opacity: ddStyle.opacity,
    visibility: ddStyle.visibility,
    display: ddStyle.display
  };
  
  const itemRect = homeItem.getBoundingClientRect();
  const ddRect = dropdown.getBoundingClientRect();
  
  const res = {
    initial: initial,
    itemRect: { x: itemRect.x, y: itemRect.y, w: itemRect.width, h: itemRect.height },
    ddTop: ddRect.top,
    ddLeft: ddRect.left,
    ddWidth: ddRect.width
  };
  
  const div = document.createElement('div');
  div.id = 'dd-result';
  div.textContent = JSON.stringify(res);
  document.body.appendChild(div);
});
</script>
"""

with open('home-2.html', 'r', encoding='utf-8') as f:
    html = f.read()

test_file = os.path.abspath('test_dd_page.html')
with open(test_file, 'w', encoding='utf-8') as f:
    f.write(html.replace('</body>', test_script + '</body>'))

res = subprocess.run([
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--window-size=1440,900',
    '--dump-dom',
    'file:///' + test_file.replace('\\', '/')
], capture_output=True, text=True)

if os.path.exists(test_file):
    os.remove(test_file)

m = re.search(r'<div id="dd-result">(.*?)</div>', res.stdout, re.DOTALL)
if m:
    print(json.dumps(json.loads(m.group(1)), indent=2))
else:
    print('Failed to get dd data')
