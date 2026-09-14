import urllib.request
import json
import urllib.parse
import os
from PIL import Image
import io

headers = {'User-Agent': 'AegisLockPhotoAuditor/4.0 (contact: info@aegislock.local)'}

def search_commons_files(query, prefix, limit=4):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit={limit}&prop=imageinfo&iiprop=url|size|mime&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            idx = 0
            for pid, p in pages.items():
                info = p.get('imageinfo', [{}])[0]
                mime = info.get('mime', '')
                if not (mime.startswith('image/jpeg') or mime.startswith('image/png')):
                    continue
                img_url = info.get('url')
                title = p.get('title')
                w = info.get('width', 0)
                h = info.get('height', 0)
                if w < 600 or h < 400:
                    continue
                print(f"[{prefix}] Found: {title} ({w}x{h})")
                
                out_path = f"scratch/candidates/{prefix}_{idx}.jpg"
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req, timeout=20) as img_resp:
                    img_data = img_resp.read()
                    img = Image.open(io.BytesIO(img_data))
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    img.save(out_path, 'JPEG', quality=90)
                    print(f"  Saved to {out_path}")
                idx += 1
    except Exception as e:
        print(f"Error {prefix}: {e}")

if __name__ == '__main__':
    search_commons_files('panic exit device door crash bar filetype:bitmap', 'panic_bar', limit=6)
    search_commons_files('RFID card reader access control door filetype:bitmap', 'access_rfid', limit=6)
    search_commons_files('safe combination dial lock filetype:bitmap', 'safe_dial', limit=6)
    search_commons_files('broken key lock filetype:bitmap', 'broken_key', limit=6)
    search_commons_files('locksmith service van interior tools filetype:bitmap', 'locksmith_van', limit=6)
