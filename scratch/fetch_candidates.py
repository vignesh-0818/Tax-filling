import urllib.request
import json
import urllib.parse
import os

candidates_dir = 'scratch/candidates'
os.makedirs(candidates_dir, exist_ok=True)

def search_and_download(term, output_filename, limit=5):
    query = f'{term} filetype:bitmap'
    url = f'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit={limit}&prop=imageinfo&iiprop=url|size|mime&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLockPhotoAuditor/1.0 (contact: info@example.com)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            idx = 0
            for pid, p in pages.items():
                info = p.get('imageinfo', [{}])[0]
                mime = info.get('mime', '')
                if not mime.startswith('image/jpeg') and not mime.startswith('image/png'):
                    continue
                img_url = info.get('url')
                title = p.get('title')
                width = info.get('width', 0)
                height = info.get('height', 0)
                if width < 500 or height < 350:
                    continue
                print(f'Found: {title} ({width}x{height})')
                
                out_path = os.path.join(candidates_dir, f'{output_filename}_{idx}.jpg')
                req_img = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req_img, timeout=15) as img_resp:
                    with open(out_path, 'wb') as fp:
                        fp.write(img_resp.read())
                print(f'  Saved to {out_path}')
                idx += 1
    except Exception as e:
        print(f'Error for {term}: {e}')

if __name__ == '__main__':
    search_and_download('safe combination dial lock', 'safe')
    search_and_download('overhead door closer hydraulic', 'door_closer')
    search_and_download('access control rfid card reader door', 'access_control')
    search_and_download('commercial door panic exit crash bar', 'commercial_security')
    search_and_download('mobile locksmith van', 'van')
    search_and_download('broken key lock pick extractor', 'key_extraction')
