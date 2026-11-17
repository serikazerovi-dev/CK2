"""Bake concealment into portable sprite assets; originals remain unchanged."""
from pathlib import Path
import json
import argparse
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
story=json.loads((ROOT/'story/story.json').read_text(encoding='utf-8'))
variants={(n['sprite'],n.get('visibility','full')) for n in story['nodes'] if n.get('sprite') and n.get('visibility','full')!='full'}
parser=argparse.ArgumentParser()
parser.add_argument('--sprite',help='Rebuild only this character')
parser.add_argument('--images',type=Path,required=True,help='Private image directory outside the published site')
args=parser.parse_args()
IMAGES=args.images.resolve()
if IMAGES==ROOT or ROOT in IMAGES.parents: parser.error('Images must be outside the published site')
if args.sprite: variants={v for v in variants if v[0]==args.sprite}
for name,visibility in sorted(variants):
    im=Image.open(IMAGES/f'sprites/{name}.webp').convert('RGBA')
    stops=[(0,(0,0,0,255)),(.6,(68,68,68,255)),(1,(119,119,119,255))] if visibility=='obscured' else [(0,(0,0,0,255)),(.12,(0,0,0,238)),(.30,(0,0,0,119)),(.48,(0,0,0,0)),(1,(0,0,0,0))]
    ramp=Image.new('RGBA',(1,im.height))
    for y in range(im.height):
        t=y/max(1,im.height-1)
        for (a,ca),(b,cb) in zip(stops,stops[1:]):
            if a<=t<=b:
                f=(t-a)/(b-a);ramp.putpixel((0,y),tuple(round(ca[i]+(cb[i]-ca[i])*f) for i in range(4)));break
    veil=ramp.resize(im.size)
    # Blend colors, then retain exactly the original silhouette alpha.
    base=im.copy();base.putalpha(255)
    baked=Image.alpha_composite(base,veil);baked.putalpha(im.getchannel('A'))
    baked.save(IMAGES/f'sprites/{name}-{visibility}.webp',quality=95,method=6)
print(f'Prepared {len(variants)} concealed sprite variants.')
