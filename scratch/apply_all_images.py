import os
from PIL import Image

def crop_and_resize(img, target_width, target_height):
    # Determine target aspect ratio
    target_ratio = target_width / target_height
    orig_width, orig_height = img.size
    orig_ratio = orig_width / orig_height

    if orig_ratio > target_ratio:
        # Source is wider than target: crop left and right
        new_width = int(orig_height * target_ratio)
        offset_x = (orig_width - new_width) // 2
        crop_box = (offset_x, 0, offset_x + new_width, orig_height)
    else:
        # Source is taller than target: crop top and bottom
        new_height = int(orig_width / target_ratio)
        offset_y = (orig_height - new_height) // 2
        crop_box = (0, offset_y, orig_width, offset_y + new_height)

    cropped = img.crop(crop_box)
    resized = cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)
    return resized

BRAIN_DIR = r"C:\Users\vv356\.gemini\antigravity-ide\brain\4cbd1104-b306-4bc3-9a57-d168a10a0d56"
SCRATCH_CANDIDATES = r"c:\Users\vv356\Downloads\Locksmith\scratch\candidates"

tasks = [
    # Services (12)
    {
        "src": os.path.join(BRAIN_DIR, "lockout_service_1788977919726.jpg"),
        "dest": "assets/images/services/emergency-lockout-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "key_cutting_machine_1788978060798.jpg"),
        "dest": "assets/images/services/key-cutting-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "lock_repair_service_1788978082494.jpg"),
        "dest": "assets/images/services/lock-rekeying-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "deadbolt_installation_1788978129799.jpg"),
        "dest": "assets/images/services/deadbolt-installation-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "auto_key_programming_1788978294032.jpg"),
        "dest": "assets/images/services/automotive-key-programming-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "smart_lock_install_1788978325984.jpg"),
        "dest": "assets/images/services/smart-lock-installation-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "master_key_comm_1788978351127.jpg"),
        "dest": "assets/images/services/commercial-master-key-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(SCRATCH_CANDIDATES, "crash_bar_doors.jpg"),
        "dest": "assets/images/services/commercial-security-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(SCRATCH_CANDIDATES, "safe_cmi.jpg"),
        "dest": "assets/images/services/safe-opening-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(SCRATCH_CANDIDATES, "locksmith_1920.jpg"),
        "dest": "assets/images/services/broken-key-extraction-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "check_axis_access.jpg"),
        "dest": "assets/images/services/access-control-new.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "check_door_closer_rot.jpg"),
        "dest": "assets/images/services/door-hardware-repair-new.jpg",
        "w": 1200, "h": 800
    },

    # Blogs (6)
    {
        "src": os.path.join(BRAIN_DIR, "deadbolt_guide_1788977728290.jpg"),
        "dest": "assets/images/blog/blog-deadbolt-guide.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "lockout_emergency_1788977748830.jpg"),
        "dest": "assets/images/blog/blog-locked-out-tips.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "smart_vs_deadbolt_1788977772322.jpg"),
        "dest": "assets/images/blog/blog-smart-vs-deadbolt.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "lock_rekey_guide_1788977815135.jpg"),
        "dest": "assets/images/blog/blog-rekey-vs-replace.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "car_key_programming_1788977836171.jpg"),
        "dest": "assets/images/blog/blog-car-key-programming.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "master_key_system_1788977886682.jpg"),
        "dest": "assets/images/blog/blog-commercial-master-keys.jpg",
        "w": 1200, "h": 800
    },

    # Legacy Blog Copies (6)
    {
        "src": os.path.join(BRAIN_DIR, "deadbolt_guide_1788977728290.jpg"),
        "dest": "assets/images/blog-1.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "lockout_emergency_1788977748830.jpg"),
        "dest": "assets/images/blog-2.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "smart_vs_deadbolt_1788977772322.jpg"),
        "dest": "assets/images/blog-3.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "lock_rekey_guide_1788977815135.jpg"),
        "dest": "assets/images/blog-4.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "car_key_programming_1788977836171.jpg"),
        "dest": "assets/images/blog-5.jpg",
        "w": 1200, "h": 800
    },
    {
        "src": os.path.join(BRAIN_DIR, "master_key_system_1788977886682.jpg"),
        "dest": "assets/images/blog-6.jpg",
        "w": 1200, "h": 800
    },

    # Emergency Mobile Van
    {
        "src": os.path.join(BRAIN_DIR, "check_work_van.jpg"),
        "dest": "assets/images/emergency-van.jpg",
        "w": 1600, "h": 1067
    },

    # Heroes
    {
        "src": os.path.join(BRAIN_DIR, "schriever_locksmith.jpg"),
        "dest": "assets/images/heroes/pricing.jpg",
        "w": 1600, "h": 1067
    },
    {
        "src": os.path.join(BRAIN_DIR, "check_work_van.jpg"),
        "dest": "assets/images/heroes/contact.jpg",
        "w": 1600, "h": 1067
    }
]

print(f"Executing {len(tasks)} image placement tasks...")
for t in tasks:
    src_path = t["src"]
    dest_path = t["dest"]
    w = t["w"]
    h = t["h"]

    if not os.path.exists(src_path):
        print(f"ERROR: Source does not exist: {src_path}")
        continue

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with Image.open(src_path) as img:
        if img.mode != "RGB":
            img = img.convert("RGB")
        out_img = crop_and_resize(img, w, h)
        out_img.save(dest_path, "JPEG", quality=92, progressive=True, optimize=True)

    size_kb = os.path.getsize(dest_path) / 1024
    print(f"SUCCESS: {dest_path} -> {w}x{h} ({size_kb:.1f} KB)")

print("\nAll image placements completed!")
