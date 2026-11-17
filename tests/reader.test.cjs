const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../reader-core.js');
const root=path.resolve(__dirname,'..');
const art=JSON.parse(fs.readFileSync(path.join(root,'assets/packs/index.json'),'utf8'));
const hasArt=(folder,file)=>Object.hasOwn(art.entries,`assets/${folder}/${file}`);
const story=JSON.parse(fs.readFileSync(path.join(root,'story/story.json'),'utf8'));
const source=JSON.parse(fs.readFileSync(path.join(root,'story/source-paragraphs.json'),'utf8'));
const coverage=JSON.parse(fs.readFileSync(path.join(root,'story/coverage.json'),'utf8'));

test('all five parts and every source dialogue block are represented',()=>{
  assert.equal(story.chapters.length,5);
  const sourceBlocks=[];
  source.forEach((text,p)=>{let j=0;for(const m of text.matchAll(/\[([^\[\]]+)\]/g)){sourceBlocks.push({paragraph:p,ordinal:j++,raw:m[1].trim()});}});
  assert.equal(coverage.dialogueBlocks,sourceBlocks.length);
  for(const block of sourceBlocks){
    const nodes=story.nodes.filter(n=>n.source===block.paragraph&&n.sourceOrdinal===block.ordinal);
    assert.ok(nodes.length,`Missing source ${block.paragraph}:${block.ordinal}`);
    if(!coverage.adaptedDialogueParagraphs.includes(block.paragraph)){
      const raw=block.raw.includes(':')?block.raw.slice(block.raw.indexOf(':')+1):block.raw;
      const expected=raw.replace(/^\s*\*[^*]+\*\s*:?\s*/,'').trim().replace(/^["“”]+|["“”]+$/g,'').trim().replace(/\s+/g,' ');
      const actual=nodes.map(n=>n.text).join(' ').replace(/\s+/g,' ');
      assert.ok(actual.includes(expected),`Changed source wording at ${block.paragraph}:${block.ordinal}`);
    }
  }
  assert.equal(story.nodes.at(-1).kind,'ending');
});
test('all assets and navigation targets resolve inside the portable site',()=>{
  const ids=new Set(story.nodes.map(n=>n.id));assert.equal(ids.size,story.nodes.length);
  for(const n of story.nodes){
    for(const bg of [n.background,n.glitch].filter(Boolean))assert.ok(hasArt('cg',bg+'.webp'),bg);
    if(n.sprite)assert.ok(hasArt('sprites',n.sprite+'.webp'),n.sprite);
    if(n.video)assert.ok(fs.existsSync(path.join(root,n.video)));
    for(const c of n.choices||[])assert.ok(ids.has(c.target));
  }
  for(const c of story.chapters)assert.ok(ids.has(c.start));
  const shown=new Set(story.nodes.flatMap(n=>[n.background,n.glitch]).filter(Boolean));
  // This supplied CG is deliberately unused: the MC never witnessed it.
  for(const file of Object.keys(art.entries).filter(p=>p.startsWith('assets/cg/')).map(p=>path.basename(p)).filter(file=>file!=='0-05-013.webp'))assert.ok(shown.has(file.replace('.webp','')),`CG never shown: ${file}`);
  assert.equal(story.nodes.find(n=>n.source===127).background,'0-02-003');
  assert.ok(!shown.has('0-05-013'));
});
test('both optional routes reach the ending without loops or dead ends',()=>{
  for(const option of [0,1]){
    let position=0,steps=0;
    while(story.nodes[position].kind!=='ending'){
      const n=story.nodes[position];
      position=n.kind==='choice'?story.nodes.findIndex(next=>next.id===n.choices[option].target):position+1;
      assert.ok(position>=0&&position<story.nodes.length);
      assert.ok(++steps<=story.nodes.length,'Story route loops');
    }
    assert.equal(story.nodes[position].part,5);
  }
});
test('anonymous identities and three sprite states follow their reveals',()=>{
  const opening=story.nodes.find(n=>n.source===7);assert.equal(opening.sprite,null);assert.equal(opening.speaker,'???');
  const guide=story.nodes.find(n=>n.source===24);assert.equal(guide.visibility,'partial');assert.equal(guide.speaker,'???');
  const reveal=story.nodes.find(n=>n.source===44);assert.equal(reveal.visibility,'full');assert.equal(reveal.sprite,'arielle');
  const scientist=story.nodes.find(n=>n.source===57);assert.equal(scientist.visibility,'obscured');
  assert.ok(story.nodes.filter(n=>n.source===428||n.source===434).every(n=>n.kind==='thought'));
});
test('backtracking and choices save the actual reading trail',()=>{
  let state=core.create(story,'Alex');
  const choice=story.nodes.find(n=>n.kind==='choice');
  state=core.move(state,choice.id,story);
  state=core.move(state,choice.choices[1].target,story);
  assert.equal(core.back(state).nodeId,choice.id);
  state=core.back(state);state=core.move(state,choice.choices[0].target,story);
  assert.equal(state.trail.at(-1),choice.choices[0].target);
  assert.equal(state.trail.length,3);
  assert.deepEqual(core.validate(JSON.parse(JSON.stringify(state)),story),state);
});
test('corrupt, incompatible, and fabricated saves are rejected',()=>{
  const state=core.create(story,'Alex');
  for(const patch of [{version:'old'},{nodeId:'not-real'},{cursor:99},{trail:['bad']},{trail:[]}])assert.throws(()=>core.validate({...state,...patch},story));
  assert.equal(core.settings({fontSize:999,textSpeed:-10,name:'  '}).fontSize,32);
  assert.equal(core.display('Hello MC-NAME. MC Pendragon, follow me.','Alex'),'Hello Alex. Alex Pendragon, follow me.');
});
test('site has no API dependencies, private runtime, or oversized Git files',()=>{
  for(const name of ['index.html','app.js','reader-core.js','style.css','story/story.js']){
    const text=fs.readFileSync(path.join(root,name),'utf8');
    assert.doesNotMatch(text,/fetch\(|\/api\/|HF_TOKEN|model-cache|C:\\\\Users/);
  }
  function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else assert.ok(fs.statSync(file).size<100*1024*1024,`${file} exceeds GitHub's file limit`);}}
  visit(root);
});

test('enemy sprites respect encounter reveals and previous reading saves migrate',()=>{
  const harpies=story.nodes.filter(n=>n.enemy==='harpy');
  assert.ok(harpies.length);assert.ok(harpies.every(n=>n.source>=43&&n.source<=50&&n.sprite==='arielle'));
  for(const source of [324,360]){
    const shadowBeat=story.nodes.find(n=>n.source===source);
    assert.ok(shadowBeat);assert.ok(!shadowBeat.enemy);assert.ok(!shadowBeat.sprite);
  }
  assert.ok(story.nodes.filter(n=>n.source===323).every(n=>!n.enemy));
  for(const n of story.nodes.filter(n=>n.enemy))assert.ok(hasArt('sprites',n.enemy+'.webp'));
  const saved=core.create(story);saved.version='vn1-32972237cf2c';
  assert.equal(core.validate(saved,story).version,story.version);
});
const spriteArt=require('../sprite-art.js');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
test('sprite swaps wait for all decoded layers and discard stale loads',async()=>{
  const first=deferred(),next=deferred(),enemy=deferred(),events=[];
  const present=spriteArt.createPresenter({prepare:name=>({first,next,enemy}[name].promise),hide:()=>events.push('hide'),commit:(images,spec)=>events.push(spec.map(s=>s?.name||null))});
  const old=present([{name:'first',visibility:'obscured'},null]);
  assert.deepEqual(events,['hide']);
  const latest=present([{name:'next',visibility:'partial'},{name:'enemy',visibility:'full'}]);
  first.resolve({});await old;assert.deepEqual(events,['hide','hide']);
  next.resolve({});await Promise.resolve();assert.equal(events.length,2);
  enemy.resolve({});await latest;assert.deepEqual(events[2],['next','enemy']);
  await present([{name:'next',visibility:'partial'},{name:'enemy',visibility:'full'}]);
  assert.equal(events.length,3,'same composition should not flash or reload');
});
test('failed sprite preparation stays hidden and can retry; removal cancels pending reveal',async()=>{
  let fail=true,hidden=0,commits=0,errors=0;
  const present=spriteArt.createPresenter({prepare:async()=>{if(fail)throw Error('decode');return {};},hide:()=>hidden++,commit:()=>commits++,onError:()=>errors++});
  const spec=[{name:'guide',visibility:'obscured'},null];
  await present(spec);assert.equal(commits,0);assert.equal(errors,1);assert.equal(hidden,1);
  fail=false;await present(spec);assert.equal(commits,1);
  const load=deferred(),shown=[];
  const cancel=spriteArt.createPresenter({prepare:()=>load.promise,hide:()=>{},commit:images=>shown.push(images)});
  const pending=cancel(spec);await cancel([null,null]);load.resolve({});await pending;
  assert.deepEqual(shown,[[null,null]]);
});

test('every concealed sprite has a portable pre-rendered bitmap',()=>{
  for(const n of story.nodes.filter(n=>n.sprite&&n.visibility!=='full')){
    assert.ok(hasArt('sprites',n.sprite+'-'+n.visibility+'.webp'));
  }
});

test('all four passerby lines use their assigned fully obscured sprites',()=>{
  const names=['business-man','business-woman','female-officer','traveler-man'];
  names.forEach((sprite,i)=>{
    const lines=story.nodes.filter(n=>n.speaker===`Passerby ${i+1}`);
    assert.ok(lines.length);
    for(const line of lines){assert.equal(line.sprite,sprite);assert.equal(line.visibility,'obscured');}
  });
});

test('succubus dialogue uses only the pre-rendered partially obscured sprite',()=>{
 const lines=story.nodes.filter(n=>[323,325,353].includes(n.source)&&n.speaker==='???');
 assert.equal(lines.length,5);
 for(const n of lines){assert.equal(n.sprite,'succubus');assert.equal(n.visibility,'partial');assert.ok(!n.enemy);}
});
