import os, re
from glob import glob

html_files = glob('*.html')
img_src_regex = re.compile(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
bg_img_regex = re.compile(r'url\([\'"]?([^\'")]+)[\'"]?\)', re.IGNORECASE)

all_images = {}
for hf in html_files:
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    imgs = img_src_regex.findall(content)
    bgs = bg_img_regex.findall(content)
    for img in imgs:
        all_images.setdefault(img, set()).add(hf)
    for bg in bgs:
        all_images.setdefault(bg, set()).add(hf)

print(f"Total unique image paths found: {len(all_images)}")
for img, files in sorted(all_images.items()):
    print(f"{img:55} -> {sorted(list(files))}")
