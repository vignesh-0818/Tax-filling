import urllib.request, json
from PIL import Image

titles = [
    'File:Schriever locksmith key to base accessibility (5257090).jpg',
    'File:Schriever locksmith key to base accessibility (5257088).jpg',
    'File:Schriever locksmith key to base accessibility (5257089).jpg',
    'File:Keys to the Castle (7395840).jpg',
    'File:Key Change (7395905).jpg'
]

headers = {'User-Agent': 'AegisLockSecurityHero/2.0 (contact@aegislock.local)'}

for title in titles:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            for pid, p in data['query']['pages'].items():
                if 'imageinfo' in p:
                    ii = p['imageinfo'][0]
                    img_url = ii['url']
                    w, h = ii['width'], ii['height']
                    print(f"{title}: {w}x{h} -> {img_url}")
                    fn = title.replace('File:', '').replace(' ', '_').replace('(', '').replace(')', '')
                    dest = f"scratch/{fn}"
                    req_img = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req_img) as r_img, open(dest, 'wb') as f_out:
                        f_out.write(r_img.read())
                    im = Image.open(dest)
                    im.thumbnail((500, 350))
                    im.save(f"scratch/prev_{fn}")
                    print("Saved preview:", fn)
    except Exception as e:
        print(f"Error {title}: {e}")
