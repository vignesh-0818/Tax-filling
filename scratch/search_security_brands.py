import urllib.request, json, time

queries = [
    'Medeco',
    'Mul-T-Lock',
    'Abloy lock',
    'mortise lock cylinder',
    'high security door lock',
    'emergency lock door',
    'lock picking deadbolt',
    'commercial door lock'
]

headers = {'User-Agent': 'AegisLockSecurityHero/2.0 (contact@aegislock.local)'}

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        time.sleep(1.0)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            print(f"=== Query: {q} ({len(pages)} files) ===")
            for pid, p in pages.items():
                if 'imageinfo' in p:
                    ii = p['imageinfo'][0]
                    if ii.get('width', 0) >= 1200 and (p['title'].lower().endswith('.jpg') or p['title'].lower().endswith('.png')):
                        print(f"  {p['title']} ({ii['width']}x{ii['height']}) -> {ii['url']}")
    except Exception as e:
        print(f"Error {q}: {e}")
