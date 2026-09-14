import urllib.request, json

queries = [
    'locksmith cylinder',
    'lock picking',
    'locksmithing',
    'deadbolt cylinder',
    'high security door lock',
    'lock bypass'
]

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLock/1.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            print(f"=== Query: {q} ({len(pages)} results) ===")
            for pid, p in pages.items():
                if 'imageinfo' in p:
                    ii = p['imageinfo'][0]
                    if ii.get('width', 0) >= 1200:
                        print(f"  {p['title']} ({ii['width']}x{ii['height']})")
    except Exception as e:
        print("Error for", q, e)
