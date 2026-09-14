import subprocess, os

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
viewports = [
    ("desktop_1440", 1440, 900),
    ("laptop_1100", 1100, 800),
    ("tablet_768", 768, 1024),
    ("mobile_375", 375, 667)
]

art_dir = r"C:\Users\vv356\.gemini\antigravity-ide\brain\4cbd1104-b306-4bc3-9a57-d168a10a0d56"
url = "file:///" + os.path.abspath("home-2.html").replace("\\", "/")

from PIL import Image

for name, w, h in viewports:
    out_img = os.path.join(art_dir, f"navbar_{name}.png")
    subprocess.run([
        chrome_path,
        "--headless=new",
        f"--window-size={w},{h}",
        "--screenshot=" + out_img,
        url
    ], capture_output=True)
    if os.path.exists(out_img):
        im = Image.open(out_img)
        # crop top 500px or full height if smaller
        crop_h = min(550, im.height)
        crop = im.crop((0, 0, im.width, crop_h))
        crop.save(out_img)
    print(f"Captured and cropped {name}: {out_img}")

