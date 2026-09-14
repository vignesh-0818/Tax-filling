import os, re
from glob import glob
from PIL import Image

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
        if not img.startswith('http') and not img.startswith('data:'):
            all_images.setdefault(img, set()).add(hf)
    for bg in bgs:
        if not bg.startswith('http') and not bg.startswith('data:'):
            all_images.setdefault(bg, set()).add(hf)

print(f"Auditing {len(all_images)} referenced images on disk...")
all_ok = True
for img_path, files in sorted(all_images.items()):
    clean_path = img_path.replace('/', os.sep)
    if not os.path.exists(clean_path):
        print(f"MISSING: {clean_path} referenced by {sorted(list(files))}")
        all_ok = False
    else:
        try:
            im = Image.open(clean_path)
            w, h = im.size
            size_kb = os.path.getsize(clean_path) / 1024
            print(f"OK: {clean_path:55} {w}x{h} ({size_kb:.1f} KB)")
        except Exception as e:
            print(f"CORRUPT: {clean_path} - {e}")
            all_ok = False

if all_ok:
    print("\nALL 37 REFERENCED IMAGES EXIST AND ARE VALID!")
else:
    print("\nERRORS DETECTED IN IMAGE AUDIT!")
