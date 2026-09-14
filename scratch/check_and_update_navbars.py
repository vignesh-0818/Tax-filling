import os
import re

files = [
    'index.html', 'index-2.html', 'about.html', 'services.html', 'service-details.html',
    'pricing.html', 'tax-calendar.html', 'blog.html', 'blog-details.html', 'contact.html',
    'audit-support.html', 'bookkeeping.html', 'business-tax-planning.html', 'financial-reporting.html',
    'gst-returns.html', 'income-tax.html', 'payroll-accounting.html', 'privacy-policy.html',
    'tax-notice-assistance.html', 'terms.html', 'virtual-cfo-services.html'
]

pattern = re.compile(r'<div class="d-flex align-items-center gap-3 nav-buttons-mobile">[\s\S]*?</div>')

replacement = '''<div class="d-flex align-items-center gap-3 nav-buttons-mobile">
                        <button class="theme-toggle-btn" aria-label="Toggle Theme"><i class="bi bi-moon-stars"></i></button>
                        <button class="rtl-toggle-btn fs-6 fw-bold" aria-label="Toggle RTL">RTL</button>
                        <a href="dashboard.html" class="nav-link fw-semibold" id="navDashboardBtn">Dashboard</a>
                        <a href="login.html" class="nav-link fw-semibold" id="navLoginBtn">Login</a>
                        <a href="register.html" class="btn btn-primary-brand btn-sm px-3" id="navGetStartedBtn">Get Started</a>
                        <a href="login.html" class="btn btn-primary-brand btn-sm px-3" id="navLogoutBtn" style="display: none;">Logout</a>
                    </div>'''

updated = []
skipped = []

for filename in files:
    if not os.path.exists(filename):
        skipped.append((filename, "File does not exist"))
        continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = pattern.search(content)
    if not match:
        skipped.append((filename, "Pattern not found"))
        continue
    
    new_content = pattern.sub(replacement, content, count=1)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    updated.append(filename)

print(f"Updated {len(updated)} files:")
for u in updated:
    print(f" - {u}")

if skipped:
    print(f"Skipped {len(skipped)} files:")
    for s, reason in skipped:
        print(f" - {s}: {reason}")
