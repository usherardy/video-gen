"""Frost the photo areas of the real DECRU app mockups (no recognizable faces), keep the UI crisp.
Writes assets/<name>_frost.png at 2x for sharp cards. Rects are in the 512px-wide source coordinates."""
from PIL import Image, ImageFilter, ImageChops
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/assets')

cols = [(4, 168), (174, 338), (345, 509)]
SPEC = {
    'discover': dict(sigma=7,
        blur=[(x0, y0, x1, y1) for (y0, y1) in [(228, 467), (531, 770), (834, 1114)] for (x0, x1) in cols],
        lum=[(118 + dx, 238 + dy, 160 + dx, 278 + dy) for dy in (0, 303, 606) for dx in (0, 170, 341)], keep=[(40, 985, 480, 1080)]),
    'feed': dict(sigma=16, blur=[(0, 60, 512, 1114)],
        lum=[(170, 92, 322, 150), (445, 88, 500, 140), (205, 738, 315, 765)],
        keep=[(0, 0, 512, 60), (428, 625, 495, 825), (18, 778, 280, 850), (18, 860, 292, 975), (40, 982, 482, 1082)]),
    'mall': dict(sigma=8,
        blur=[(20, 165, 490, 520)] + [(x0, y0, x1, y1) for (y0, y1) in [(535, 730), (745, 940)] for (x0, x1) in [(20, 166), (182, 328), (343, 490)]] + [(20, 955, 490, 1114)],
        lum=[(30, 425, 260, 505)] + [(x0, y1 - 42, x1, y1) for (y0, y1) in [(535, 730), (745, 940)] for (x0, x1) in [(20, 166), (182, 328), (343, 490)]], keep=[]),
}
for name, s in SPEC.items():
    src = Image.open(f'{name}.webp').convert('RGB')
    out = src.copy()
    for r in s['blur']:
        region = src.crop(r).filter(ImageFilter.GaussianBlur(s['sigma']))
        out.paste(region, r[:2])
    mask = Image.new('L', src.size, 0)
    for r in s['keep']:                                   # feathered rectangles for opaque UI panels
        m = Image.new('L', src.size, 0); m.paste(255, (r[0] + 3, r[1] + 3, r[2] - 3, r[3] - 3)); mask = ImageChops.lighter(mask, m.filter(ImageFilter.GaussianBlur(3)))
    gray = src.convert('L')
    for r in s.get('lum', []):                            # white text/icons only: brightness mask, grown and softened
        m = Image.new('L', src.size, 0); m.paste(gray.crop(r).point(lambda v: 255 if v > 205 else 0), r[:2])
        mask = ImageChops.lighter(mask, m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))
    out = Image.composite(src, out, mask)
    out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS)
    out.save(f'{name}_frost.png', optimize=True)
    print(name, out.size, os.path.getsize(f'{name}_frost.png') // 1024, 'KB')
