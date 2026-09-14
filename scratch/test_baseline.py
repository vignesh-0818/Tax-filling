import subprocess, os, json, re

test_script = """
<script>
window.addEventListener('load', () => {
  const links = Array.from(document.querySelectorAll('.nav-menu .nav-link'));
  const data = links.map(link => {
    let textNode = null;
    for (let child of link.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
        textNode = child;
        break;
      }
    }
    if (textNode) {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rect = range.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      return {
        text: textNode.textContent.trim(),
        link_y: Math.round(linkRect.y * 10) / 10,
        link_h: Math.round(linkRect.height * 10) / 10,
        text_y: Math.round(rect.y * 10) / 10,
        text_bottom: Math.round(rect.bottom * 10) / 10,
        text_h: Math.round(rect.height * 10) / 10
      };
    }
    return { text: link.innerText };
  });
  const div = document.createElement('div');
  div.id = 'baseline-result';
  div.textContent = JSON.stringify(data);
  document.body.appendChild(div);
});
</script>
"""

with open('home-2.html', 'r', encoding='utf-8') as f:
    html = f.read()

test_file = os.path.abspath('test_baseline_page.html')
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

m = re.search(r'<div id="baseline-result">(.*?)</div>', res.stdout, re.DOTALL)
if m:
    print(json.dumps(json.loads(m.group(1)), indent=2))
else:
    print('Failed to get baseline data')
