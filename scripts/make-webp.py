"""Create a .webp next to every large .jpg/.png under images/landing-pages
(max 1600 px wide, quality 78). build-properties then serves the .webp
whenever one exists. Run once after adding photos:
    python scripts/make-webp.py
"""
import os, sys
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True  # a few source JPEGs are slightly truncated
root = os.path.join(os.path.dirname(__file__), '..', 'images', 'landing-pages')
made = saved = 0
for d, _, files in os.walk(root):
    for f in files:
        if not f.lower().endswith(('.jpg', '.jpeg', '.png')): continue
        src = os.path.join(d, f); dst = os.path.splitext(src)[0] + '.webp'
        if os.path.exists(dst) or os.path.getsize(src) < 150_000: continue
        im = Image.open(src)
        if im.mode in ('P', 'LA'): im = im.convert('RGBA')
        if im.mode == 'RGBA' and f.lower().endswith(('.jpg', '.jpeg')): im = im.convert('RGB')
        if im.width > 1600: im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=78, method=6)
        made += 1; saved += os.path.getsize(src) - os.path.getsize(dst)
print(f'{made} webp files, {saved/1e6:.1f} MB smaller')
