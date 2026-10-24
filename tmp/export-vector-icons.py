from pathlib import Path
from collections import Counter
from PIL import Image
import pdfplumber
from pdfminer.pdfdevice import PDFDevice
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.utils import apply_matrix_pt

root = Path(__file__).resolve().parents[1]
names = ['knowledge-graph','analytics','responsibility','innovation','impact','quality-trust','data-integration','knowledge-engineering','ai-agents','collaboration','research','ai-reasoning']
class SVGDevice(PDFDevice):
    def paint_path(self, state, stroke, fill, evenodd, path):
        commands=[]
        for segment in path:
            op,*values=segment
            if op == 'h': op = 'z'
            points=[apply_matrix_pt(self.ctm,(values[i],values[i+1])) for i in range(0,len(values),2)]
            points=[(x,self.height-y) for x,y in points]
            if op=='v':
                points=[self.last]+points
                op='c'
            elif op=='y':
                points=points+[points[-1]]
                op='c'
            commands.append(op.upper()+' '.join(f'{v:.5f}' for point in points for v in point))
            if points: self.last=points[-1]
        self.paths.append('<path d="'+ ' '.join(commands) +'" fill="'+(self.ink if fill else 'none')+'" stroke="'+(self.ink if stroke else 'none')+f'" stroke-width="{state.linewidth}" fill-rule="'+('evenodd' if evenodd else 'nonzero')+'"/>')

for i,name in enumerate(names,1):
    source=root/f'resource/icon/{i}.pdf'
    with pdfplumber.open(source) as pdf:
        page=pdf.pages[0]
        objects=page.curves+page.rects+page.lines
        x=min(o['x0'] for o in objects)-4
        y=min(o['top'] for o in objects)-4
        w=max(o['x1'] for o in objects)+4-x
        h=max(o['bottom'] for o in objects)+4-y
        height=page.height
    pixels=Image.open(root/f'tmp/icon-preview/{i}.png').convert('RGB').getdata()
    ink='#%02x%02x%02x'%Counter(p for p in pixels if max(p)<180).most_common(1)[0][0]
    manager=PDFResourceManager()
    device=SVGDevice(manager)
    device.paths=[];device.height=height;device.ink=ink
    with source.open('rb') as stream:
        PDFPageInterpreter(manager,device).process_page(next(PDFPage.get_pages(stream)))
    (root/f'resource/icon/brand/{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}"><title>{name.replace("-"," ")}</title>'+''.join(device.paths)+'</svg>\n',encoding='utf-8')
