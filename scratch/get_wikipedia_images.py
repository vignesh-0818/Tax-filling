import urllib.request
import json
import urllib.parse
import os
from PIL import Image
import io

headers = {'User-Agent': 'AegisLockPhotoAuditor/5.0 (contact: info@aegislock.local)'}

def get_page_images(page_title):
    url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(page_title)}&prop=images&format=json"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        pages = data.get('query', {}).get('pages', {})
        for pid, p in pages.items():
            images = [img['title'] for img in p.get('images', [])]
            return images

def download_image_info(title, out_name):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size|mime&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                info = p.get('imageinfo', [{}])[0]
                img_url = info.get('url')
                if img_url and (img_url.endswith('.jpg') or img_url.endswith('.JPG') or img_url.endswith('.png')):
                    w = info.get('width', 0)
                    h = info.get('height', 0)
                    if w < 500 or h < 300:
                        continue
                    clean_title = title.encode('ascii', 'replace').decode('ascii')
                    print(f"Downloading {clean_title} ({w}x{h})")
                    img_req = urllib.request.Request(img_url, headers=headers)
                    with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                        img = Image.open(io.BytesIO(img_resp.read()))
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        out_path = f"scratch/candidates/{out_name}.jpg"
                        img.save(out_path, 'JPEG', quality=90)
                        print(f"  -> Saved {out_path} ({img.size})")
                        return True
    except Exception as e:
        print(f"Error {title}: {e}")
    return False

articles = {
    'Crash_bar': 'commercial_security',
    'Electric_strike': 'access_control_strike',
    'Door_closer': 'door_closer_wiki',
    'Safe': 'safe_wiki',
    'Lock_picking': 'lockpick_wiki',
    'Keycard_lock': 'keycard_wiki'
}

for art, prefix in articles.items():
    imgs = get_page_images(art)
    print(f"\n=== Article: {art} ({len(imgs)} images) ===")
    count = 0
    for img in imgs:
        if any(bad in img.lower() for bad in ['flag', 'icon', 'logo', 'symbol', 'map', 'diagram', 'svg']):
            continue
        success = download_image_info(img, f"{prefix}_{count}")
        if success:
            count += 1
            if count >= 3:
                break
