import urllib.request
import json
import urllib.parse

def search_files(term):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(term + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLockPhotoAuditor/8.0 (contact: info@aegislock.local)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            print(f"=== {term} ({len(pages)} items) ===")
            for pid, p in pages.items():
                title = p.get('title', '').encode('ascii', 'replace').decode('ascii')
                info = p.get('imageinfo', [{}])[0]
                url_img = info.get('url', '')
                w = info.get('width', 0)
                h = info.get('height', 0)
                desc = info.get('extmetadata', {}).get('ImageDescription', {}).get('value', '')[:80].encode('ascii', 'replace').decode('ascii')
                print(f"  {title} ({w}x{h}) - {desc}")
    except Exception as e:
        print(f"Error {term}: {e}")

search_files('Schluesseldienst auto')
search_files('locksmith service van')
search_files('white cargo van commercial')
search_files('mobile service vehicle')
