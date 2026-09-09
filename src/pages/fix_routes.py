import re

with open('/workspace/app-c18l1vf2nz7l/src/routes.tsx', 'r') as f:
    content = f.read()

# Add import if not exists
if 'MainLayout' not in content:
    content = "import MainLayout from '@/components/layouts/MainLayout';\n" + content

def wrap_element(match):
    path = match.group(1)
    element = match.group(2)
    
    # Skip paths that already have MainLayout inside them (like /, /detector, /dashboard)
    skip_paths = [
        '/', '/detector', '/dashboard', '/tools', '/tools/:id', 
        '/community', '/community/discussions/:id', '/marketplace', '/marketplace/:id',
        '/sell', '/admin', '/admin/features', '/admin/users', '/admin/products', '/admin/moderation',
        '/admin/articles', '/admin/feature-controls', '/admin/api-health', '/admin/email',
        '/blog', '/blog/:id', '/pricing', '/newsletter', '/about', '/careers', '/press', '/contact',
        '/privacy', '/terms', '/cookies', '/api', '/document-intelligence', '/document-workspace'
    ]
    
    # Also we should skip auth routes maybe? /login, /signup
    # Actually, grep said LoginPage.tsx and SignupPage.tsx need layout!
    # Wait, do they have their own special layout? Let's check.
    
    return f"path: '{path}',\n    element: {element},"

# Let's just do a manual string replace for the groups of routes that need it!
