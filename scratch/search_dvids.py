import urllib.request, json, time

queries = [
    'DVIDS locksmith',
    'locksmith cylinder',
    'deadbolt installation',
    'door lock key',
    'lock security'
]

headers = {'User-Agent': 'AegisLockSecurityHero/2.0 (contact@aegislock.local)'}

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&srnamespace=6&srlimit=8&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        time.sleep(0.5)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== Query: {q} ===")
            for item in data['query']['search']:
                print(ascii(item['title']))
    except Exception as e:
        print("Error:", e)
