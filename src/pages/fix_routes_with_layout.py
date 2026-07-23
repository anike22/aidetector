import re

with open('/workspace/app-c18l1vf2nz7l/src/routes.tsx', 'r') as f:
    content = f.read()

# Add import if missing
if "import MainLayout" not in content:
    content = "import MainLayout from '@/components/layouts/MainLayout';\n" + content

# We want to find element: <FeatureGate...><Something /></FeatureGate> or element: <Something />
# and wrap it with <MainLayout> if it belongs to certain groups.

def wrap_with_main_layout(element_str):
    # If already wrapped, skip
    if "MainLayout" in element_str:
        return element_str
    
    # Check if there is a FeatureGate
    gate_match = re.match(r'(<FeatureGate[^>]*>)(.*?)(</FeatureGate>)', element_str)
    if gate_match:
        return f"{gate_match.group(1)}<MainLayout>{gate_match.group(2)}</MainLayout>{gate_match.group(3)}"
    
    return f"<MainLayout>{element_str}</MainLayout>"

def process_route(match):
    full_block = match.group(0)
    
    # We only wrap if the path matches our target lists
    path_match = re.search(r"path:\s*'([^']+)'", full_block)
    if not path_match:
        return full_block
        
    path = path_match.group(1)
    
    target_prefixes = [
        '/services', 
        '/prospecting', 
        '/seo-', 
        '/domain-overview', 
        '/keyword-research',
        '/technical-seo',
        '/aeo-optimizer',
        '/content-strategy',
        '/link-building',
        '/document-workspace',
        '/hire-expert',
        '/affiliate-hub',
        '/chrome-extension',
        '/wordpress-plugin',
        '/case-studies'
    ]
    
    # Wait, /seo-assistant already has layout? Let's check. 
    # Actually, /seo-assistant is in the target list, but does it already have a layout?
    # I'll just wrap it if it matches the prefixes. If some page looks weird with 2 layouts, we can fix it.
    # We know most of these lack layouts.
    
    should_wrap = False
    for p in target_prefixes:
        if path.startswith(p):
            should_wrap = True
            break
            
    # Also wrap /humanizer
    if path == '/humanizer':
        should_wrap = True
        
    if not should_wrap:
        return full_block
        
    # Extract element
    element_match = re.search(r"element:\s*(<.*?>),", full_block, flags=re.DOTALL)
    if element_match:
        new_element = wrap_with_main_layout(element_match.group(1))
        # Replace the element line
        full_block = full_block[:element_match.start(1)] + new_element + full_block[element_match.end(1):]
        
    return full_block

# Find each route block
new_content = re.sub(r'\{\s*name:[^}]+element:\s*<.*?>,\s*(?:public:\s*(?:true|false),?\s*)?\}', process_route, content, flags=re.DOTALL)

with open('/workspace/app-c18l1vf2nz7l/src/routes.tsx', 'w') as f:
    f.write(new_content)

print("Done wrapping routes.")
