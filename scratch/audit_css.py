import os, re
from glob import glob

css_files = glob('assets/css/*.css')
bg_regex = re.compile(r'url\([\'"]?([^\'")]+)[\'"]?\)', re.IGNORECASE)

for cf in css_files:
    with open(cf, 'r', encoding='utf-8') as f:
        content = f.read()
    bgs = bg_regex.findall(content)
    for bg in bgs:
        if not bg.startswith('data:') and not bg.startswith('http'):
            resolved = os.path.normpath(os.path.join(os.path.dirname(cf), bg))
            exists = os.path.exists(resolved)
            print(f"{cf}: {bg} -> {resolved} (exists: {exists})")
