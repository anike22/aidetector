import re
from datetime import datetime

with open('/workspace/app-c18l1vf2nz7l/src/routes.tsx', 'r') as f:
    content = f.read()

paths = re.findall(r"path:\s*'([^']+)'", content)

# List of hidden routes that must NOT be indexed or included in sitemaps
HIDDEN_ROUTES = {
    '/services',
    '/services/all',
    '/services/ai-consulting',
    '/services/conversion-optimization',
    '/services/website-development',
    '/services/growth-marketing',
    '/services/seo-consulting',
    '/services/business-website-design',
    '/services/seo-website-design',
    '/services/custom-website-development',
    '/services/ecommerce-website-development',
    '/services/landing-page-design',
    '/services/website-development/request',
    '/services/website-development/book-meeting',
    '/hire-expert',
}

sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

base_url = "https://aidetector.cx"
date_str = datetime.now().strftime("%Y-%m-%d")

seen_paths = set()

for path in paths:
    # Skip dynamic paths like /:id
    if ':' in path or '*' in path:
        continue
    
    # Skip hidden services
    if path in HIDDEN_ROUTES or any(path.startswith(hr + '/') for hr in HIDDEN_ROUTES):
        continue
        
    # Skip admin/auth pages
    if path.startswith('/admin') or path.startswith('/auth'):
        continue
        
    if path in seen_paths:
        continue
    seen_paths.add(path)
    
    # Format url
    url = f"{base_url}{path}" if path.startswith('/') else f"{base_url}/{path}"
    
    # Priority
    priority = "0.8"
    if path == '/':
        priority = "1.0"
    elif path.startswith('/services'):
        priority = "0.9"
        
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
