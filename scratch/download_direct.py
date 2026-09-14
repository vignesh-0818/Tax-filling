import urllib.request
import json
import urllib.parse
import os
from PIL import Image
import io

headers = {'User-Agent': 'AegisLockDirectDownloader/1.0 (contact: info@aegislock.local)'}
os.makedirs('scratch/candidates', exist_ok=True)

file_list = [
    ('File:Electric strike with monitoring contact.jpg', 'electric_strike_contact'),
    ('File:Electric strike.jpg', 'electric_strike_basic'),
    ('File:Electric Strike Doors.jpg', 'electric_strike_doors'),
    ('File:Set of Crash Bar Doors.jpg', 'crash_bar_doors'),
    ('File:Automatic Door with Bars.jpg', 'auto_door_bars'),
    ('File:Mechanical door closer.jpg', 'mech_door_closer'),
    ('File:Lockpicks.jpg', 'lockpicks'),
    ('File:Picked lock.jpg', 'picked_lock'),
    ('File:Lockpicking-Set.jpg', 'lockpicking_set'),
    ('File:0011Moebeltresor.JPG', 'moebeltresor_safe'),
    ('File:Locksmith-1947387 1920.jpg', 'locksmith_1920'),
]

for title, out_name in file_list:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                info = p.get('imageinfo', [{}])[0]
                img_url = info.get('url')
                if img_url:
                    print(f"Downloading {title}...")
                    img_req = urllib.request.Request(img_url, headers=headers)
                    with urllib.request.urlopen(img_req, timeout=20) as img_resp:
                        img = Image.open(io.BytesIO(img_resp.read()))
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        out_path = f"scratch/candidates/{out_name}.jpg"
                        img.save(out_path, 'JPEG', quality=90)
                        print(f"  -> Saved {out_path}: {img.size}")
    except Exception as e:
        print(f"Error {title}: {e}")
