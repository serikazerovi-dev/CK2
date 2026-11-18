"""Compile the author's dialogue with an explicit browser demo staging map.

Run with --docx to refresh the extracted source, or without arguments to rebuild
from the included source paragraphs. Source paragraph numbers are zero-based.
"""
import argparse
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--docx', type=Path)
args = parser.parse_args()
source_path = ROOT / 'story/source-paragraphs.json'
if args.docx:
    with zipfile.ZipFile(args.docx) as z:
        xml = ET.fromstring(z.read('word/document.xml'))
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns)) for p in xml.findall('.//w:body/w:p', ns)]
    paragraphs = [p for p in paragraphs if p.strip()]
    source_path.write_text(json.dumps(paragraphs, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'story/source-info.json').write_text(json.dumps({'document': args.docx.name, 'sha256': hashlib.sha256(args.docx.read_bytes()).hexdigest(), 'paragraphs': len(paragraphs), 'adapted': '2026-11-17'}, indent=2), encoding='utf-8')
else:
    paragraphs = json.loads(source_path.read_text(encoding='utf-8'))

chapters = [
    {'id': 1, 'title': 'The Temple of Time', 'subtitle': 'A choice already made', 'cover': '0-01-011'},
    {'id': 2, 'title': 'Star Lake Inn', 'subtitle': 'Ten years earlier', 'cover': '0-02-001'},
    {'id': 3, 'title': 'Dreams from the Future', 'subtitle': 'The things a dream remembers', 'cover': '0-03-001'},
    {'id': 4, 'title': 'The Black Knights', 'subtitle': 'Behind closed doors', 'cover': '0-04-023'},
    {'id': 5, 'title': 'Fates Entwined', 'subtitle': 'What remains of an angel', 'cover': '0-05-002'},
]
part_at = {1: 1, 104: 2, 147: 3, 238: 4, 469: 5}
# Only actual changes in the authored staging; descriptive references are not
# treated as instructions to display a CG. Reference environments replace maps.
cgs = {
    3:'0-01-001', 12:'0-01-002', 23:'0-01-003', 26:'0-01-004', 28:'0-01-005',
    35:'0-01-006',36:'0-01-007',40:'0-01-008',41:'0-01-009',53:'0-01-010',
    68:'0-01-011',73:'0-01-012',83:'0-01-013',91:'0-01-014',99:'0-01-015',
    109:'0-02-001',120:'0-02-003',128:'0-05-014',131:'0-02-004',153:'0-03-001',160:'0-03-002',
    165:'0-03-003',168:'0-03-004',174:'0-02-004',199:'0-03-005',203:'0-03-006',
    216:'0-03-007',227:'0-03-008',232:'0-02-004',239:'0-02-004',241:'0-04-001',
    258:'0-04-002',264:'0-04-003',267:'0-04-004',286:'0-04-005',300:'0-04-006',
    311:'0-04-007',313:'0-04-008',314:'0-04-009',319:'0-04-007',329:'0-04-010',
    334:'0-04-011',339:'0-04-012',343:'0-04-011',349:'0-04-013',357:'0-04-014',
    363:'0-04-015',368:'0-04-016',372:'0-04-017',375:'0-04-018',378:'0-04-019',
    380:'0-04-020',385:'0-04-021',398:'0-04-022',426:'0-04-023',430:'0-04-024',
    440:'0-04-025',457:'0-04-008',460:'0-02-004',465:'0-04-026',471:'0-05-001',
    494:'0-05-002',501:'0-05-003',511:'0-05-004',516:'0-05-005',520:'0-05-012',
    523:'0-05-006',530:'0-05-007',535:'0-05-008',543:'0-05-009',547:'0-05-010',
    555:'0-05-003',563:'0-05-011',568:'0-05-012',574:'0-02-004',579:None,
}
# Room backgrounds are allowed character layers. CG compositions already
# containing characters stay unobstructed. Unknown identities stay unknown.
layered = {'0-01-003','0-01-006','0-01-007','0-01-008','0-01-009','0-01-010',
           '0-02-004','0-03-006','0-03-007','0-04-022',
           '0-05-002','0-05-003','0-05-005','0-05-011','0-05-012'}
locations = {
  1:'Temple of Time',12:'A city in the future',23:'Temple basement',28:'A half-remembered night',35:'Temple basement',
  40:'Temple garden',53:'The laboratory · midnight',68:'The golden gates',91:'The laboratory · the accident',
  104:'Elysium · by the lake',131:'The Star Lake Inn',147:'The Star Lake Inn',153:'A future apartment',174:'The Star Lake Inn · morning',
  185:'Elysium · around town',196:'The Star Lake Inn · night',199:'The Carpenters',216:'The laboratory',232:'The Star Lake Inn · Friday',
  238:'The Star Lake Inn · Saturday',247:'Military Branch HQ',258:'Military HQ · map room',272:'Military HQ · training level',
  279:'Military HQ · evacuation corridor',286:'The warehouse · from above',294:'The evacuation lift',296:'The stairwell',300:'The underground warehouse',
  349:'The sealed chamber',385:'The warehouse',398:'The infirmary',420:'Elysium · Saturday night',422:'The church · after dark',426:'The graveyard · moonrise',
  460:'The Star Lake Inn',465:'Between waking and sleep',469:'The Star Lake Inn · Sunday',494:'Elysium Church',501:'Father Carter’s chamber',
  520:'The old chapel',555:'Father Carter’s chamber',563:'The old chapel',574:'The Star Lake Inn · evening',579:'A dream of gold',
}
# Authored gameplay is adapted explicitly here; it is never presented as a
# simulated battle, procedural job result, or generated character response.
bridges = {
  23:('A chest stands in a room off the tunnel. Beside it, a door remains sealed.', 'Approach the chest'),
  25:('You open the chest. Inside lies a black rod, its dark surface traced with violet markings.', 'Take the Black Rod'),
  26:('The rod settles into your hand. The ground shudders; stone cracks somewhere beyond the room, and the world falls away.', None),
  35:('The memory fades. Back in the room, the chest has vanished.', None),
  36:('A wall has collapsed in the next room, revealing stairs and a way forward.', None),
  40:('You climb into a hall of white marble and hourglasses, then step out toward the garden. Fire blocks the road. Two barrels stand nearby.', None),
  42:('The barrels break beneath the rod. Water spills over the flames, opening the path.', 'Continue through the garden'),
  43:('Three harpies descend across the path. The figure who has guided you steps into the light.', None),
  50:('Arielle strikes once, twice, a third time. The harpies recoil, but the fight is not over.', None),
  52:('You call on the full extent of Arielle’s power. The harpies fall, and another memory takes their place.', None),
  128:('You follow Viviane through the park and into town, toward the Star Lake Inn.', 'Follow Viviane'),
  177:('For your first working day, there is a place waiting for you in the inn’s kitchen.', 'Work at the Star Lake Inn'),
  179:('The morning passes in a bustle of cooking and serving. By the time your shift ends, the guests are asking who made their meals.', None),
  185:('With the day’s work done, you take a walk through Elysium and meet some of the people who call it home.', None),
  196:('At last you return to your room. The town grows quiet outside the window.', 'Turn in for the night'),
  236:('Friday passes in work and wandering. When evening comes, you return to the inn. This time, no dream follows you into sleep.', 'Rest until Saturday'),
  255:('The guard leads you through the building. An argument carries through the door ahead.', 'Follow the guard'),
  272:('Lohen takes you down in the elevator to the training level.', None),
  275:('You work through the first of the two training challenges.', 'Complete the first drill'),
  277:('You finish the second challenge. Before Lohen can answer, an alarm erupts and the lights turn red.', 'Follow Lohen'),
  280:('You hurry into a long corridor lined with windows. Halfway along it, Lohen stops.', None),
  292:('Lohen turns away toward the warehouse. You follow the corridor toward the exit. Behind you, a scream cuts through the alarm.', None),
  294:('The evacuation lift refuses to open. ACCESS DENIED glows on its panel. The only way left is back.', 'Go back for Lohen and Natalie'),
  296:('The corridor is darker now. Down the circular stairwell, shadows gather around the steps.', None),
  324:('The Black Rod breaks through the advancing shadows. Ten fall before you. Then the gunfire stops, and the remaining shapes flow together into a single figure.', 'Face the demon'),
  326:('She darts through a door at the side of the warehouse and disappears.', None),
  346:('Lohen is unconscious. With Natalie still struggling and the demon loose, you follow it into the next room.', 'Pursue the succubus'),
  360:('Twelve shadows crowd the doorway. You fight your way through them with the rod, clearing a path to Arielle.', 'Strike the distracted succubus'),
  382:('You step out of the chamber. The alarm stops.', None),
  451:('Nemesia shows you how to call the Black Rod into your hand at will.', None),
  463:('After a shower, you fall into bed. In the dark, something begins to shine.', None),
  520:('In the old chapel, you push a barrel of holy water toward the sunbeam falling from the balcony. Ayumi’s book lies within reach.', 'Begin the ritual'),
  551:('You dress and carry the strip of pink cloth back to Father Carter.', 'Return to Father Carter'),
}
replacements = {
  7:'Hey, you’ve already made your choice. Keep moving through the tunnel.',
  24:'Strange. I do not remember this being here. You should check it out.',
  41:'You should hit those barrels. I think they have water in them, this should help with the fire.',
  47:'Quickly… together, we stand stronger against these foes.',
  49:'Let me lead the way. Your trust grants me strength.',
  50:'The tide of battle wanes. Summon the full extent of my power… let’s turn the scales.',
}
actors = {'Arielle':'arielle','Viviane':'viviane','General Edward Blackwood':'edward','Lohen Blackwood':'lohen',
          'Natalie Blackwood':'natalie','Nemesia':'nemesia','Father Carter':'carter','Michael Carter':'carter','Ayumi':'ayumi',
          'Arthur Nightingale':'arthur','Henry Crust':'henry','Tom Crust':'tom','Nathan Fairchild':'nathan',
          'Abigail Stone':'abigail','Christine Smith':'christine','Sophie Fairchild':'sophie','Guard':'guard',
          'Female Colleague':'scientist'}
nodes=[]
part=1
bg=None
location='Temple of Time'
camera='center'
source_dialogues=[]

def emit(kind, text='', speaker='', source=None, **extra):
    node={'id': f'n{len(nodes):04}', 'part':part,'kind':kind,'text':text,'speaker':speaker,
          'background':bg,'location':location,'camera':camera,'source':source}
    node.update(extra)
    nodes.append(node)
    return node

def identity(label, p):
    name=label.split(',')[0].strip()
    if name.startswith('Viviane'): name='Viviane'
    if name.startswith('Ayumi'): name='Ayumi'
    if name.startswith('MC and Lohen'): name='You and Lohen'
    elif name.startswith('MC'): name='You'
    if name.startswith('???'): name='???'
    actor=actors.get(name)
    visibility='full'
    if p==7: actor=None
    elif p==24 or p==37 or p==41: actor='arielle'; visibility='partial'
    elif p in (43,44): actor='arielle'
    elif 'Female' in label or name=='Female Colleague': actor='scientist'; visibility='obscured'
    elif 'Boss' in label: actor='boss'; visibility='obscured'
    elif name=='???' and 203<=p<=214: actor='man'; visibility='obscured'
    elif name=='???' and 216<=p<=229: actor='scientist'; visibility='obscured'
    if bg not in layered and bg is not None: actor=None
    passerby_sprites = {'Passerby 1':'business-man','Passerby 2':'business-woman','Passerby 3':'female-officer','Passerby 4':'traveler-man'}
    if name in passerby_sprites:
        actor=passerby_sprites[name]; visibility='obscured'
    # No sprite is revealed in the opening disembodied line or over existing CG characters.
    return name,actor,visibility

def chunks(text, limit=470):
    if len(text)<=limit: return [text]
    bits=re.split(r'(?<=[.!?…])\s+',text)
    result=[]; current=''
    for bit in bits:
        if current and len(current)+len(bit)>limit:
            result.append(current); current=''
        current=(current+' '+bit).strip()
    if current: result.append(current)
    return result

def dialogue(p):
    for j, match in enumerate(re.finditer(r'\[([^\[\]]+)\]',paragraphs[p])):
        raw=match.group(1).strip()
        source_dialogues.append({'paragraph':p,'ordinal':j,'raw':raw})
        if ':' in raw:
            label,text=raw.split(':',1)
        else:
            label,text='',raw
        name,actor,visibility=identity(label,p)
        # Acting directions remain metadata rather than spoken prose.
        text=re.sub(r'^\s*\*[^*]+\*\s*:?\s*','',text).strip().strip('"“”').strip()
        if p in replacements: text=replacements[p]
        kind='narration' if name=='Narrator' else ('thought' if 'mind' in label or 'thought' in label else 'dialogue')
        if not label: kind='whisper'
        repeats=3 if p in (317,458) else 1
        for repeat in range(repeats):
            for segment in chunks(text):
                node=emit(kind,segment,name,p,sourceOrdinal=j,sprite=actor,visibility=visibility)
                if p==113 and j==0 and segment==chunks(text)[0]: node['glitch']='0-02-002'
                if p in (317,458): node['effect']='pulse'; node['background']='0-04-009' if repeat==2 else '0-04-008'
                if p in (102,233): node['transition']='fade'

for p, paragraph in enumerate(paragraphs):
    if p in part_at:
        part=part_at[p]; bg=None; camera='center'
        location=locations[p]
        emit('chapter',chapters[part-1]['subtitle'],source=p,title=chapters[part-1]['title'])
    if p in locations: location=locations[p]
    if p in (185,247,272,279,294,296,420,422,463,470): bg=None
    if p in cgs:
        bg=cgs[p]; camera='center'
    if p in (73,): camera='pan'
    if p in (91,97,311): camera='right'
    if p in (95,99): camera='left'
    if p in (303,312): camera='left'
    if p==305: camera='right'
    if p==322: camera='center'
    if p in (368,511): camera='rise'
    if p==196: dialogue(182)
    if p in bridges:
        text,action=bridges[p]
        emit('action' if action else 'narration',text,'Narrator',p,adapted=True,action=action)
    if p==342:
        emit('choice','Natalie is still struggling. The succubus has fled into the next room.',source=p,
             choices=[{'label':'Check on Natalie','targetSource':344},{'label':'Follow the succubus','targetSource':346}])
    if p in (182,183): continue  # The optional town introductions precede returning to bed.
    if p==196:
        dialogue(183)
    dialogue(p)
    if p in (166,170):
        emit('narration', '“With automation mastered, our next frontier awaits.”' if p==166 else 'Much of the article is illegible. A few words stand out: “Time.” “Mysteries.” “We strive forward.”', 'Narrator',p,adapted=True)
    # Preserve deliberately silent establishing shots when no immediate speech follows.
    if p in (3,35,68,153,160,165,168,199,203,216,227,241,258,264,267,286,300,311,329,334,339,349,357,363,368,372,375,378,385,398,426,430,440,465,471,494,511,516,523,530,535,543,547,563,568):
        pass  # The next textual beat inherits this composition without an extra empty click.

# Resolve authored optional detours after numbering, so skipped content remains available.
for node in nodes:
    if node['kind']=='choice':
        for choice in node['choices']:
            target_source=choice.pop('targetSource')
            choice['target']=next(n['id'] for n in nodes if n['source']==target_source)
emit('ending','The prologue is complete.',title='The Casanova Killer',video='assets/video/prologue-ending-v12.mp4')
for chapter in chapters:
    chapter['start']=next(n['id'] for n in nodes if n['kind']=='chapter' and n['part']==chapter['id'])
for node in nodes:
    p=node.get('source')
    if p is not None and 43<=p<=50:
        node['enemy']='harpy'
        node['sprite']='arielle'
        node['visibility']='full'
    if p in (324,325): node['sprite']=None
    if p in (323,325,353) and node.get('speaker')=='???':
        node['sprite']='succubus'
        node['visibility']='partial'
        node.pop('enemy',None)
revision=hashlib.sha256(json.dumps(nodes,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:12]
openings=[
    {'id':'v12','title':'Opening · v12','default':True,'video':'assets/video/prologue-ending-v12.mp4'},
    {'id':'v11','title':'Opening · v11 Director’s Cut','default':False,'video':'assets/video/prologue-ending-v11.mp4'},
]
story={'version':'vn1-'+revision,'compatibleVersions':['vn1-0978b005fa9f','vn1-a0acfb1b87ab','vn1-1e33fffdf44c','vn1-2e754c302197','vn1-8a2b698f5e18','vn1-32972237cf2c','vn1-bd0e1c698c2b','vn1-b06916a33189'],'title':'The Casanova Killer','chapters':chapters,'nodes':nodes,'openings':openings}
(ROOT/'story/story.json').write_text(json.dumps(story,ensure_ascii=False,indent=2),encoding='utf-8')
# A classic script also permits direct file:// previews without fetch/CORS failures.
(ROOT/'story/story.js').write_text('window.PROLOGUE = '+json.dumps(story,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'story/coverage.json').write_text(json.dumps({'sourceParagraphs':len(paragraphs),'dialogueBlocks':len(source_dialogues),'adaptedDialogueParagraphs':list(replacements),'nodes':len(nodes),'dialogues':source_dialogues},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(nodes)} reading beats; {len(source_dialogues)} source dialogue blocks; all five parts.')
