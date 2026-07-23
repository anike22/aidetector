import os
import re

directories = ['src/pages/detector', 'src/pages']

for directory in directories:
    for filename in os.listdir(directory):
        if not filename.endswith('.tsx'):
            continue
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
            
        def replace_button(match):
            tag = match.group(0)
            if 'onClick=' not in tag and 'asChild' not in tag and 'type="submit"' not in tag:
                if tag.endswith('/>'):
                    return tag[:-2] + ' onClick={() => {}} />'
                else:
                    return tag[:-1] + ' onClick={() => {}}>'
            return tag
            
        new_content = re.sub(r'<Button[^>]*>', replace_button, content)
        
        with open(filepath, 'w') as f:
            f.write(new_content)
