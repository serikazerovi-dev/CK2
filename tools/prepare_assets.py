"""Create web delivery copies. Never modifies the source art."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('art', type=Path)
parser.add_argument('--output',type=Path,required=True,help='Private image directory outside the published site')
args = parser.parse_args()
OUTPUT=args.output.resolve()
if OUTPUT==ROOT or ROOT in OUTPUT.parents: parser.error('Output must be outside the published site')
for folder in ['cg','sprites']: (OUTPUT/folder).mkdir(parents=True,exist_ok=True)
art = args.art
sprites = {
    'business-man': '30 Generic NPCs/05 Business Man - transparent.png',
    'business-woman': '30 Generic NPCs/07 Business Woman - transparent.png',
    'female-officer': '30 Generic NPCs/16 Female Officer Black Knights - transparent.png',
    'traveler-man': '30 Generic NPCs/17 Traveler Man - transparent.png',

    'harpy': '29 Enemies/01 Harpies/Harpy Base - transparent.png',
    'arielle': '02 Arielle/Arielle Base - transparent.png',
    'viviane': '05 Morrighan le Fay/Morrighan Disguised - transparent.png',
    'elizariel': '09 Elizariel/Elize Base - transparent.png',
    'nemesia': '01 Nemesia/Nemesia Base - transparent.png',
    'natalie': '03 Natalie/Natalie Base - transparent.png',
    'lohen': '15 Lohen Blackwood/Lohen Blackwood Base - transparent.png',
    'edward': '14 Edward Blackwood/Edward Blackwood Base - transparent.png',
    'carter': '10 Father Michael Carter/Michael Carter Base - transparent.png',
    'ayumi': '11 Ayumi Takashi/Ayumi Base - transparent.png',
    'scientist': '30 Generic NPCs/23 Scientist Female - transparent.png',
    'guard': '30 Generic NPCs/24 Guard - transparent.png',
    'man': '30 Generic NPCs/01 Man - transparent.png',
    'boss': '17 Arthur Nightingale/Arthur Nightingale Base - transparent.png',
    'arthur': '17 Arthur Nightingale/Arthur Nightingale Base - transparent.png',
    'henry': '23 Henry Crust/Henry Crust Base - transparent.png',
    'tom': '24 Tom Crust/Tom Crust Base - transparent.png',
    'nathan': '16 Nathan Fairchild/Nathan Fairchild Base - transparent.png',
    'abigail': '22 Abigail Stone/Abigail Stone Base - transparent.png',
    'christine': '20 Christine Smith/Christine Smith Base - transparent.png',
    'sophie': '04 Sophie/Sophie Base - transparent.png',
    'succubus': '29 Enemies/02 Succubuss/Prologue Succubuss - transparent.png',
}
manifest = []
for folder in sorted((art / '32 World Info/Prologue Specific').glob('0[1-5] *')):
    for src in sorted(folder.glob('CG *.png')):
        dest = OUTPUT / 'cg' / (src.stem.replace('CG ', '').lower() + '.webp')
        im = Image.open(src).convert('RGB')
        im.thumbnail((1920, 1600), Image.Resampling.LANCZOS)
        im.save(dest, quality=88, method=6)
        manifest.append({'file': 'assets/'+dest.relative_to(OUTPUT).as_posix(), 'source': src.relative_to(art).as_posix(), 'width': im.width, 'height': im.height})
for name, source in sprites.items():
    src = art / source
    if not src.exists():
        raise FileNotFoundError(src)
    im = Image.open(src).convert('RGBA')
    # Trim transparent padding only; preserve artwork and alpha.
    bbox = im.getchannel('A').getbbox()
    if bbox:
        im = im.crop(bbox)
    im.thumbnail((1100, 1400), Image.Resampling.LANCZOS)
    dest = OUTPUT / 'sprites' / (name + '.webp')
    im.save(dest, quality=90, method=6)
    manifest.append({'file': 'assets/'+dest.relative_to(OUTPUT).as_posix(), 'source': source, 'width': im.width, 'height': im.height})
(ROOT / 'assets/manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'Prepared {len(manifest)} assets.')
