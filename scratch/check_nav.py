import glob, re

for hf in sorted(glob.glob('*.html')):
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    m = re.search(r'<ul class=["\']nav-menu["\']>(.*?)</ul>', content, re.DOTALL)
    if m:
        items = re.findall(r'<li[^>]*>(.*?)</li>', m.group(1), re.DOTALL)
        print(f"{hf}: {len(items)} items")
        for it in items:
            clean = ' '.join(it.strip().split())
            print(f"   - {clean[:75]}")
    else:
        print(f"{hf}: NO nav-menu found")
