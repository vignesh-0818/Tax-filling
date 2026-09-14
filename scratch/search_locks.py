import urllib.request, json

queries = [
    'Schlage lock',
    'lock picking cylinder',
    'door lock mechanism',
    'locksmith cylinder key'
]

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&srnamespace=6&srlimit=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLock/1.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== Query: {q} ===")
            for item in data['query']['search']:
                print(ascii(item['title']))
    except Exception as e:
        print("Error:", e)
