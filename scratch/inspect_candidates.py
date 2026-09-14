import urllib.request, json
from PIL import Image

titles = [
    'File:Schlage B60 Door Lock.jpg',
    'File:KESO Key and Lock.JPG',
    'File:Call Local Bayview or Emergency Locksmith.jpg'
]

for title in titles:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'AegisLock/1.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            for pid, p in data['query']['pages'].items():
                if 'imageinfo' in p:
                    ii = p['imageinfo'][0]
                    img_url = ii['url']
                    print(title, img_url, ii['width'], ii['height'])
                    fn = title.replace('File:', '').replace(' ', '_')
                    dest = f"scratch/{fn}"
                    req_img = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req_img) as r_img, open(dest, 'wb') as f_out:
                        f_out.write(r_img.read())
                    im = Image.open(dest)
                    im.thumbnail((400, 300))
                    im.save(f"scratch/prev_{fn}")
                    print("Saved preview:", fn)
    except Exception as e:
        print("Error for", title, e)
