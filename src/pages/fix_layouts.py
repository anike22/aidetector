import os
import glob
import re

# Get all TSX files in src/pages
pages = glob.glob('/workspace/app-c18l1vf2nz7l/src/pages/**/*.tsx', recursive=True)
pages.extend(glob.glob('/workspace/app-c18l1vf2nz7l/src/pages/*.tsx'))

def is_top_level_page(content):
    # Only care if it exports a default function
    return "export default function" in content or "export default " in content

def has_layout(content):
    return "MainLayout" in content or "Navbar" in content or "Layout" in content

for page in set(pages):
    with open(page, 'r') as f:
        content = f.read()
    
    if not is_top_level_page(content):
        continue
        
    if has_layout(content):
        continue
        
    print(f"Needs layout: {page}")

