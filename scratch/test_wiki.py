import urllib.request
import json
import urllib.parse
import os
from PIL import Image
import io

headers = {'User-Agent': 'AegisLockPhotoAuditor/3.0 (info@aegislock.local)'}

def get_wiki_image(title, target_name):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        pages = data.get('query', {}).get('pages', {})
        for pid, p in pages.items():
            info = p.get('imageinfo', [{}])[0]
            img_url = info.get('url')
            if img_url:
                print(f"Downloading {title} -> {img_url}")
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req) as img_resp:
                    img_bytes = img_resp.read()
                    img = Image.open(io.BytesIO(img_bytes))
                    os.makedirs('scratch/candidates', exist_ok=True)
                    out_path = f'scratch/candidates/{target_name}.jpg'
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    img.save(out_path, 'JPEG', quality=90)
                    print(f"Saved {out_path}: {img.size}")

if __name__ == '__main__':
    get_wiki_image('File:A door closer by Dorma in the UK.jpg', 'door_closer_dorma')
    get_wiki_image('File:Automatic door closer.jpg', 'door_closer_auto')
    get_wiki_image('File:Australian Made CMI H2D Home Safe.JPG', 'safe_cmi')
