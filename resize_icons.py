import urllib.request
from PIL import Image
import os

url = "https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260625/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png"
output_dir = "/workspace/app-c18l1vf2nz7l/public/chrome-extension/icons"
temp_img = "/tmp/source_icon.png"

urllib.request.urlretrieve(url, temp_img)

img = Image.open(temp_img).convert("RGBA")

# Resize and save
sizes = [16, 32, 48, 128]
for size in sizes:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(os.path.join(output_dir, f"icon{size}.png"))

print("Icons generated successfully!")
