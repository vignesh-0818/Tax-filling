import urllib.request, json
from PIL import Image

titles = [
    'File:Key Change (7395905).jpg',
    'File:Key Change (7395913).jpg'
]

headers = {'User-Agent': 'AegisLockSecurityHero/2.0 (contact@aegislock.local)'}

for title in titles:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1920&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            for pid, p in data['query']['pages'].items():
                ii = p['imageinfo'][0]
                thumb_url = ii.get('thumburl', ii['url'])
                print(title, thumb_url)
                fn = title.replace('File:', '').replace(' ', '_').replace('(', '').replace(')', '')
                dest = f"scratch/{fn}_1920.jpg"
                req_img = urllib.request.Request(thumb_url, headers=headers)
                with urllib.request.urlopen(req_img) as r_img, open(dest, 'wb') as f_out:
                    f_out.write(r_img.read())
                im = Image.open(dest)
                print(f"Downloaded {fn} size:", im.size)
                im.thumbnail((500, 350))
                im.save(f"scratch/prev_{fn}.jpg")
                print("Saved preview:", fn)
    except Exception as e:
        print(f"Error {title}: {e}")
