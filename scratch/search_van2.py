import urllib.request
import json
import urllib.parse

def search_commons(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit=15&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLockAudit/8.0 (contact: info@aegislock.local)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            print(f"=== {query} ({len(pages)} items) ===")
            for pid, p in pages.items():
                title = p.get('title', '').encode('ascii', 'replace').decode('ascii')
                info = p.get('imageinfo', [{}])[0]
                url_img = info.get('url', '')
                w = info.get('width', 0)
                h = info.get('height', 0)
                desc = info.get('extmetadata', {}).get('ImageDescription', {}).get('value', '')[:70].encode('ascii', 'replace').decode('ascii')
                if w >= 800 and h >= 500:
                    print(f"  {title} ({w}x{h}) - {desc}")
    except Exception as e:
        print(f"Error: {e}")

search_commons('"mobile locksmith"')
search_commons('"locksmith" truck')
search_commons('commercial van street')
search_commons('service van tools')
