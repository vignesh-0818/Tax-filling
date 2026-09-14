import urllib.request
import json
import urllib.parse

def search(q):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLockAudit/9.0 (contact: info@aegislock.local)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            for pid, p in data.get('query', {}).get('pages', {}).items():
                title = p.get('title', '').encode('ascii', 'replace').decode('ascii')
                info = p.get('imageinfo', [{}])[0]
                w = info.get('width', 0)
                h = info.get('height', 0)
                desc = info.get('extmetadata', {}).get('ImageDescription', {}).get('value', '')[:80].encode('ascii', 'replace').decode('ascii')
                if w >= 1000 and h >= 700:
                    print(f"  {title} ({w}x{h}) - {desc}")
    except Exception as e:
        print(f"Error: {e}")

print("=== Dispatch / Call center: ===")
search("customer service dispatch headset")
print("=== Locksmith shop: ===")
search("locksmith shop keys")
print("=== Security consultation: ===")
search("security consultant consultation desk")
