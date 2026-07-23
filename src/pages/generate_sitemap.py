import re
from datetime import datetime

with open('/workspace/app-c18l1vf2nz7l/src/routes.tsx', 'r') as f:
    content = f.read()

paths = re.findall(r"path:\s*'([^']+)'", content)

sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

base_url = "https://aidetector.cx"
date_str = datetime.now().strftime("%Y-%m-%d")

for path in paths:
    # Skip dynamic paths like /:id
    if ':' in path or '*' in path:
        continue
    
    # Format url
    url = f"{base_url}{path}" if path.startswith('/') else f"{base_url}/{path}"
    
    # Priority
    priority = "0.8"
    if path == '/':
        priority = "1.0"
    elif path.startswith('/services'):
        priority = "0.9"
    elif path.startswith('/admin') or path.startswith('/auth'):
        continue # Skip admin/auth pages
        
    sitemap_content += f"  <url>\n"
    sitemap_content += f"    <loc>{url}</loc>\n"
    sitemap_content += f"    <lastmod>{date_str}</lastmod>\n"
    sitemap_content += f"    <changefreq>weekly</changefreq>\n"
    sitemap_content += f"    <priority>{priority}</priority>\n"
    sitemap_content += f"  </url>\n"

sitemap_content += '</urlset>'

with open('/workspace/app-c18l1vf2nz7l/public/sitemap.xml', 'w') as f:
    f.write(sitemap_content)

print("Sitemap generated at /public/sitemap.xml")
