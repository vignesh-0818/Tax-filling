import urllib.request, json
from PIL import Image

title = 'File:Safe Breach (7396050).jpg'
url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1920&format=json"
headers = {'User-Agent': 'AegisLockSecurityHero/2.0 (contact@aegislock.local)'}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    for pid, p in data['query']['pages'].items():
        ii = p['imageinfo'][0]
        thumb_url = ii.get('thumburl', ii['url'])
        print(title, thumb_url)
        dest = "scratch/Safe_Breach_1920.jpg"
        req_img = urllib.request.Request(thumb_url, headers=headers)
        with urllib.request.urlopen(req_img) as r_img, open(dest, 'wb') as f_out:
            f_out.write(r_img.read())
        im = Image.open(dest)
        print("Downloaded size:", im.size)
        im.thumbnail((500, 350))
        im.save("scratch/prev_safe_breach.jpg")
        print("Saved preview")
