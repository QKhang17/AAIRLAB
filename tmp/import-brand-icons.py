from pathlib import Path
from collections import Counter
import base64
import shutil
import re
import pdfplumber
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path('C:/Users/ADMIN/Desktop/icon')
dest = root / 'resource/icon/brand'
dest.mkdir(exist_ok=True)
names = ['knowledge-graph', 'analytics', 'responsibility', 'innovation', 'impact', 'quality-trust', 'data-integration', 'knowledge-engineering', 'ai-agents', 'collaboration', 'research', 'ai-reasoning']
for i, name in enumerate(names, 1):
    with pdfplumber.open(source / f'{i}.pdf') as pdf:
        page = pdf.pages[0]
        objects = page.curves + page.rects + page.lines
        left = min(o['x0'] for o in objects) - 4
        top = min(o['top'] for o in objects) - 4
        right = max(o['x1'] for o in objects) + 4
        bottom = max(o['bottom'] for o in objects) + 4
        pixels = Image.open(root / f'tmp/icon-preview/{i}.png').convert('RGB').getdata()
        rgb = Counter(p for p in pixels if max(p) < 180).most_common(1)[0][0]
        ink = '#%02x%02x%02x' % rgb
        def color(value):
            if value == 1 or value == (1, 1, 1) or value == (0, 0, 0, 0):
                return '#ffffff'
            return ink
        paths = []
        for o in objects:
            commands = []
            for command in o['path']:
                commands.append(command[0].upper() + ' '.join(f'{v:.4f}' for point in command[1:] for v in point))
            fill = color(o['non_stroking_color']) if o['fill'] else 'none'
            stroke = color(o['stroking_color']) if o['stroke'] else 'none'
            rule = 'evenodd' if o['evenodd'] else 'nonzero'
            paths.append(f'<path d="{" ".join(commands)}" fill="{fill}" stroke="{stroke}" stroke-width="{o["linewidth"]}" fill-rule="{rule}"/>')
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{left:.4f} {top:.4f} {right-left:.4f} {bottom-top:.4f}"><title>{name.replace("-", " ").title()}</title>' + ''.join(paths) + '</svg>\n'
        (dest / f'{name}.svg').write_text(svg, encoding='utf-8')

# Use the matching transparent logo already in the repository, retaining its
# original pixels and gradients. The SVG viewport removes unused canvas space.
logo_path = root / 'resource/icon/logo_remove_BG.png'
logo = Image.open(logo_path).convert('RGBA')
x0, y0, x1, y1 = logo.getchannel('A').getbbox()
pad = 10
encoded = base64.b64encode(logo_path.read_bytes()).decode('ascii')
(dest / 'aair-logo.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0-pad} {y0-pad} {x1-x0+2*pad} {y1-y0+2*pad}"><title>AAIR Lab</title><image width="{logo.width}" height="{logo.height}" href="data:image/png;base64,{encoded}"/></svg>\n', encoding='utf-8')

for f in source.iterdir():
    if f.suffix.lower() in ('.pdf', '.jpg'):
        target = root / 'resource/icon' / f.name
        if not target.exists() or target.read_bytes() != f.read_bytes():
            shutil.copyfile(f, target)

for directory in ('main/HTML', 'main/JavaScript'):
    for p in (root / directory).rglob('*'):
        if p.suffix not in ('.html', '.js'):
            continue
        text = p.read_text(encoding='utf-8')
        updated = text.replace('resource/icon/logo_remove_BG.png', 'resource/icon/brand/aair-logo.svg')
        updated = re.sub(r'type="image/png"(?=\s+href="[^"]*brand/aair-logo.svg)', 'type="image/svg+xml"', updated)
        if updated != text:
            p.write_text(updated, encoding='utf-8')

p = root / 'main/HTML/Home/home.html'
text = p.read_text(encoding='utf-8')
icons = iter(['knowledge-engineering', 'ai-agents', 'quality-trust', 'data-integration'])
text = re.sub(r'(<span class="home-feature__icon[^\"]*">)<svg.*?</svg>', lambda m: m[1] + f'<img src="/resource/icon/brand/{next(icons)}.svg" alt="" width="64" height="64" loading="lazy">', text)
p.write_text(text, encoding='utf-8')

rows = '\n'.join(f'| {i}.pdf | `{name}.svg` |' for i, name in enumerate(names, 1))
(dest / 'README.md').write_text('# AAIR brand assets\n\nImported from the supplied artwork. Original PDF/JPG files are retained in the parent directory. SVG icons retain the PDF paths with tight viewports; navy colors are sampled from the rendered originals.\n\n| Source | Web asset |\n| --- | --- |\n' + rows + '\n\n`aair-logo.svg` embeds the existing transparent rendition matching the supplied logo, with a tighter viewport. It preserves the original gradient raster pixels; it is not a vector reconstruction. Use at navigation sizes or up to 120 CSS pixels.\n', encoding='utf-8')
print('Imported 12 icons, framed logo, source artwork, and updated project logo references.')
