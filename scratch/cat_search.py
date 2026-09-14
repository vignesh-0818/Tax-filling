import urllib.request, json, time

categories = [
    'Category:Locksmithing',
    'Category:Door_locks',
    'Category:Padlocks',
    'Category:Lockpicking'
]

headers = {'User-Agent': 'AegisLockSecurityHero/2.0 (contact@aegislock.local)'}

for cat in categories:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle={urllib.parse.quote(cat)}&cmnamespace=6&cmlimit=25&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        time.sleep(0.5)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            members = data.get('query', {}).get('categorymembers', [])
            print(f"=== {cat} ({len(members)} files) ===")
            for m in members:
                if m['title'].lower().endswith('.jpg') or m['title'].lower().endswith('.png'):
                    print(" ", ascii(m['title']))
    except Exception as e:
        print(f"Error {cat}: {e}")
