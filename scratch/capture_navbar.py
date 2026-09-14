import subprocess, time, os, json
import urllib.request

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out_img = os.path.abspath(r"scratch\navbar_capture.png")
html_url = "file:///" + os.path.abspath("home-2.html").replace("\\", "/")

# Run Chrome headless to capture screenshot
cmd = [
    chrome_path,
    "--headless=new",
    "--window-size=1440,900",
    f"--screenshot={out_img}",
    html_url
]
subprocess.run(cmd, check=True)
print("Screenshot captured at:", out_img)
