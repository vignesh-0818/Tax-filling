import urllib.request
import json
import time
import urllib.parse
from PIL import Image
import io
import os

headers = {'User-Agent': 'AegisLockPhotoAuditor/4.0 (contact: info@aegislock.local)'}

def search_files(term):
    query = term + " filetype:bitmap"
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    req = urllib.request.Request(url, headers=headers)
    results = []
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                title = p.get('title', '')
                info = p.get('imageinfo', [{}])[0]
                url_img = info.get('url', '')
                w = info.get('width', 0)
                h = info.get('height', 0)
                if w >= 600 and h >= 400 and (url_img.lower().endswith('.jpg') or url_img.lower().endswith('.jpeg') or url_img.lower().endswith('.png')):
                    results.append((title, url_img, w, h))
    except Exception as e:
        print(f"Error {term}: {e}")
    time.sleep(1.5)
    return results

terms = [
    ('rfid_door', 'RFID reader door entry'),
    ('keypad_door', 'keypad electronic door access'),
    ('service_van', 'service van commercial cargo'),
    ('work_van', 'Ford transit service vehicle'),
    ('door_closer', 'overhead door closer commercial door')
]

for key, term in terms:
    print(f"Searching: {term}...")
    res = search_files(term)
    for title, url, w, h in res[:4]:
        clean_title = title.encode('ascii', 'replace').decode('ascii')
        print(f"  {clean_title} ({w}x{h})")
        # download to scratch/candidates
        try:
            time.sleep(1.0)
            img_req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                img = Image.open(io.BytesIO(img_resp.read()))
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                safe_name = key + "_" + str(hash(title) % 10000) + ".jpg"
                out_path = os.path.join('scratch/candidates', safe_name)
                img.save(out_path, 'JPEG', quality=90)
                print(f"    -> Saved {out_path}")
        except Exception as e:
            print(f"    Download error: {e}")
