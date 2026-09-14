import urllib.request
from PIL import Image

url = "https://upload.wikimedia.org/wikipedia/commons/f/fb/Multlock_287_high.jpg"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
dest = "scratch/Multlock_287_high.jpg"

with urllib.request.urlopen(req) as resp, open(dest, 'wb') as f:
    f.write(resp.read())

im = Image.open(dest)
print("Multlock size:", im.size)
im.thumbnail((600, 400))
im.save("scratch/prev_multlock.jpg")
print("Saved prev_multlock.jpg")
