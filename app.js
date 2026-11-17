/* Static browser demo reader: no network API, models, analytics, or account. */
(async()=>{
'use strict';
try{await window.AssetArt.ready;}catch{return;}
document.querySelector('.title-art').style.backgroundImage=`url("${window.AssetArt.url('assets/cg/0-01-011.webp')}")`;
document.getElementById('ending-video').poster=window.AssetArt.url('assets/cg/0-01-011.webp');
document.getElementById('asset-loading').hidden=true;
document.getElementById('app').inert=false;
const story=window.PROLOGUE, core=window.ReaderCore;
const $=id=>document.getElementById(id);
const index=new Map(story.nodes.map((node,i)=>[node.id,i]));
const KEY='casanova-vn-2026-11';
let storageWarning=false;
function read(key,fallback){try{return JSON.parse(localStorage.getItem(KEY+key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(KEY+key,JSON.stringify(value));return true;}catch{if(!storageWarning){toast('Browser storage is unavailable. Export a save before leaving.');storageWarning=true;}return false;}}
let prefs=core.settings(read('-settings',{}));
let state=null,auto=false,typeTimer=null,autoTimer=null,glitchTimers=[],fullText='',typed=false,token=0,currentBackground=null,toastTimer;
let slots=read('-slots',[null,null,null]);
if(!Array.isArray(slots)||slots.length!==3)slots=[null,null,null];
slots=slots.map(save=>{try{return core.validate(save,story);}catch{return null;}});
const saved=read('-auto',null);
if(saved){try{state=core.validate(saved,story);}catch{state=null;}}
const node=()=>state?story.nodes[index.get(state.nodeId)]:null;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3800);}
function applyPrefs(){document.documentElement.style.setProperty('--story-size',prefs.fontSize+'px');document.body.classList.toggle('no-motion',prefs.reducedMotion);document.body.classList.toggle('sans',prefs.sans);}
function persist(){if(!state)return;state.name=prefs.name;state.savedAt=new Date().toISOString();write('-auto',state);$('resume-button').hidden=false;}
function stopTimers(){clearInterval(typeTimer);clearTimeout(autoTimer);glitchTimers.forEach(clearTimeout);glitchTimers=[];token++;}
function stopAuto(){auto=false;clearTimeout(autoTimer);$('auto-button').setAttribute('aria-pressed','false');$('auto-button').textContent='Auto';}
function scheduleAuto(){clearTimeout(autoTimer);if(auto&&state&&!$('panel').open&&!$('reader').hidden&&!document.hidden&&!['action','choice','chapter','ending'].includes(node().kind)){autoTimer=setTimeout(advance,Math.max(prefs.autoDelay*1000,fullText.length*45));}}
function showScreen(id){document.body.classList.toggle('cinema-mode',id==='ending-screen');for(const name of ['reader','title-screen','ending-screen'])$(name).hidden=name!==id;}
function showText(show=true){document.body.classList.toggle('art-only',!show);$('show-text').hidden=show;$('hide-text').hidden=!show;}
function imagePath(id){return window.AssetArt.url('assets/cg/'+id+'.webp');}
let cameraKey='',cameraMode='center',cameraAnimation=null;
function frameCamera(animate=true){
  const image=$('scene-image'),stage=$('scene-frame');
  if(!image.naturalWidth||!stage.clientWidth||image.hidden)return;
  const w=stage.clientWidth,h=stage.clientHeight,iw=image.naturalWidth,ih=image.naturalHeight;
  const moving=cameraMode!=='center';
  // This authored close-up is framed on Elizariel, not letterboxed as a panorama.
  const closeup=currentBackground==='0-01-013';
  // One continuous warehouse shot: retain scale and vertical framing across
  // center -> Lohen -> Natalie, changing only the horizontal camera position.
  const warehouseFocus=currentBackground==='0-04-006';
  const ayumiFocus=currentBackground==='0-05-004';
  const scale=ayumiFocus?Math.max(w/(iw*.72),h/(ih*.46)):warehouseFocus?Math.max(w/(iw*.46),h/(ih*.85)):closeup?Math.max(w/iw,h/ih):cameraMode==='rise'?Math.max(h*1.8/ih,Math.min(w,700)/iw):moving?Math.max(w/iw,h/ih)*1.12:Math.min(w/iw,h/ih);
  const width=iw*scale,height=ih*scale;
  image.style.width=width+'px';image.style.height=height+'px';
  const pose=(x,y=.2)=>`translate(${width<w?(w-width)/2:-(width-w)*x}px,${height<h?(h-height)/2:-(height-h)*y}px)`;
  const ayumiX=Math.max(w-width,Math.min(0,w/2-width*.55));
  const target=ayumiFocus?`translate(${ayumiX}px,${Math.max(h-height,Math.min(0,h*.12-height*.215))}px)`:warehouseFocus
    ?`translate(${cameraMode==='left'?0:cameraMode==='right'?w-width:Math.max(w-width,Math.min(0,w/2-width*.60))}px,${Math.max(h-height,Math.min(0,h/2-height*.48))}px)`
    :pose(cameraMode==='left'?0:cameraMode==='right'?1:.5,cameraMode==='rise'?0:.2);
  const previous=getComputedStyle(image).transform;
  cameraAnimation?.cancel();image.style.transform=target;
  image.style.visibility='visible';
  // Still shots must never interpolate from the preceding CG's transform.
  if(closeup||!moving||!animate||prefs.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const frames=cameraMode==='pan'?[{transform:pose(0)},{transform:pose(1),offset:.55},{transform:target}]:cameraMode==='rise'?[{transform:ayumiFocus?`translate(${ayumiX}px,${Math.max(h-height,h/2-height*.65)}px)`:pose(.5,1)},{transform:target}]:[{transform:previous==='none'?target:previous},{transform:target}];
  cameraAnimation=image.animate(frames,{duration:cameraMode==='pan'?9000:4000,easing:'ease-in-out',fill:'forwards'});
}
$('scene-image').addEventListener('load',()=>frameCamera());
new ResizeObserver(()=>frameCamera(false)).observe($('stage'));
function paintBackground(id,camera='center'){
  const image=$('scene-image');
  if(id!==currentBackground){cameraAnimation?.cancel();image.style.visibility='hidden';currentBackground=id;$('art-error').hidden=true;if(id){image.src=imagePath(id);$('ambient').style.backgroundImage=`url("${imagePath(id)}")`;}else{image.removeAttribute('src');$('ambient').style.backgroundImage='none';}}
  image.hidden=!id;image.className='scene-image';
  const key=id+':'+camera;
  if(key!==cameraKey){cameraKey=key;cameraMode=camera;if(image.complete)frameCamera();}
  image.alt=id?'Illustration: '+(node()?.location||'The prologue'):'';
}
$('scene-image').addEventListener('error',()=>{if(currentBackground)$('art-error').hidden=false;});
const presentSprites=window.SpriteArt.createPresenter({
  prepare:window.SpriteArt.prepare,
  hide:()=>{ $('sprite').hidden=true;$('enemy').hidden=true; },
  commit:(images,spec)=>{
    for(const [i,id] of ['sprite','enemy'].entries()){
      const box=$(id),image=images[i];
      box.className='sprite prerendered'+(id==='enemy'?' enemy':'');
      if(!image){box.replaceChildren();box.hidden=true;continue;}
      image.id=id+'-image';image.alt='';image.draggable=false;
      box.dataset.character=spec[i].name;box.dataset.visibility=spec[i].visibility;
      box.replaceChildren(image);box.hidden=false;
    }
  },
  onError:()=>toast('Character artwork could not be loaded. Continue or return to this passage to retry.')
});
function paintSprite(n){
  $('stage').classList.toggle('encounter',!!n.enemy);
  presentSprites([
    n.sprite?{name:n.sprite,visibility:n.visibility||'full'}:null,
    n.enemy?{name:n.enemy,visibility:'full'}:null
  ]);
}
function finishText(){clearInterval(typeTimer);$('story-text').textContent=fullText;typed=true;scheduleAuto();}
function paintText(text){
  fullText=text;typed=prefs.textSpeed===0||prefs.reducedMotion;
  $('story-text').textContent=typed?text:'';
  $('story-text').scrollTop=0;
  if(typed){scheduleAuto();return;}
  // Keep screen-reader output complete while the visual text reveals.
  const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=text;
  const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');
  $('story-text').replaceChildren(accessible,visual);
  const chars=Array.from(text);let i=0;const localToken=token;
  typeTimer=setInterval(()=>{if(localToken!==token){clearInterval(typeTimer);return;}i=Math.min(chars.length,i+1);visual.textContent=chars.slice(0,i).join('');if(i===chars.length){clearInterval(typeTimer);typed=true;scheduleAuto();}},1000/prefs.textSpeed);
}
function render(){
  stopTimers();showText(true);
  const n=node();if(!n)return;
  $('ending-video').pause();
  if(n.kind==='ending'){showEnding();persist();return;}
  showScreen('reader');
  const chapter=story.chapters[n.part-1];
  $('location').textContent=n.location;$('chapter-label').textContent=`${String(n.part).padStart(2,'0')} / 05 · ${chapter.title}`;
  paintBackground(n.kind==='chapter'?chapter.cover:n.background,n.camera);paintSprite(n);
  $('stage').classList.toggle('pulse',n.effect==='pulse');
  $('chapter-card').hidden=n.kind!=='chapter';
  if(n.kind==='chapter'){$('chapter-number').textContent='ACT 0 · PART '+String(n.part).padStart(2,'0');$('chapter-title').textContent=n.title;$('chapter-subtitle').textContent=n.text;}
  $('speaker').textContent=n.kind==='chapter'?'The prologue':n.kind==='whisper'?'':n.speaker==='You'?prefs.name:n.speaker||'Your next step';
  $('delivery').textContent=n.kind==='thought'?'Private thought':'';
  $('dialogue').className='dialogue '+n.kind;
  $('back-button').disabled=state.cursor===0;
  const past=state.cursor>0?story.nodes[index.get(state.trail[state.cursor-1])]:null;
  $('previous-passage').hidden=!past;
  if(past){
    $('previous-speaker').textContent=past.speaker==='You'?prefs.name:past.speaker||'Previously';
    const previousText=core.display(past.kind==='chapter'?past.title:past.text,prefs.name);
    const ending=document.createElement('span');ending.textContent=previousText;
    $('previous-text').replaceChildren(ending);
  }
  $('next-button').hidden=n.kind==='choice';
  $('next-button').replaceChildren(document.createTextNode(n.action|| (n.kind==='chapter'?'Enter chapter':'Continue')));
  const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='→';$('next-button').append(arrow);
  const nextKey=document.createElement('kbd');nextKey.className='navigation-key';nextKey.textContent='D';nextKey.setAttribute('aria-hidden','true');$('next-button').append(nextKey);
  $('choices').replaceChildren();$('choices').hidden=n.kind!=='choice';
  if(n.kind==='choice'){stopAuto();for(const choice of n.choices){const button=document.createElement('button');button.textContent=choice.label;button.onclick=()=>go(choice.target);$('choices').append(button);}}
  const partNodes=story.nodes.filter(x=>x.part===n.part&&x.kind!=='ending');
  const partPos=partNodes.findIndex(x=>x.id===n.id)+1;
  $('reading-position').textContent=`${partPos} / ${partNodes.length}`;
  $('progress-fill').style.width=((index.get(n.id)+1)/story.nodes.length*100)+'%';
  paintText(n.kind==='chapter'?'The story continues.':core.display(n.text,prefs.name));
  if(n.glitch&&!prefs.reducedMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const localToken=token;
    glitchTimers.push(setTimeout(()=>{if(localToken!==token)return;paintBackground(n.glitch,n.camera);glitchTimers.push(setTimeout(()=>{if(localToken===token)paintBackground(n.background,n.camera);},1000));},2000+Math.random()*2000));
  }
  persist();
  // Warm only the next few illustrations, not the entire art library/video.
  const upcoming=story.nodes.slice(index.get(n.id)+1,index.get(n.id)+8);
  const urls=[...new Set(upcoming.map(x=>x.background).filter(Boolean))].slice(0,2);
  for(const id of urls){const img=new Image();img.src=imagePath(id);}
  const spriteVariants=new Map();
  for(const beat of upcoming){
    if(beat.sprite)spriteVariants.set(beat.sprite+':'+beat.visibility,[beat.sprite,beat.visibility||'full']);
    if(beat.enemy)spriteVariants.set(beat.enemy+':full',[beat.enemy,'full']);
  }
  for(const args of [...spriteVariants.values()].slice(0,4))window.SpriteArt.prepare(...args).catch(()=>{});
}
let strikeRevision=0,striking=false,strikeAnimations=[];
const strikeOverlay=document.createElement('div');
strikeOverlay.className='strike-overlay';strikeOverlay.hidden=true;strikeOverlay.setAttribute('aria-hidden','true');
const slash=document.createElement('div');slash.className='strike-slash';strikeOverlay.append(slash);document.body.append(strikeOverlay);
const lightRay=document.createElement('div');lightRay.className='chapel-light-ray';strikeOverlay.append(lightRay);
function cancelStrike(){strikeRevision++;striking=false;strikeAnimations.forEach(a=>a.cancel());strikeAnimations=[];strikeOverlay.hidden=true;}
async function strikeTo(next,effect='strike'){
  cancelStrike();striking=true;const revision=strikeRevision;stopAuto();
  const play=async(element,frames,options)=>{const animation=element.animate(frames,options);strikeAnimations.push(animation);await animation.finished;};
  try{
    // Decode the destination while the current passage is still visible.
    const preview=new Image();preview.src=imagePath(next.background);
    await Promise.race([preview.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1500))]);
    if(revision!==strikeRevision)return;
    const illumination=effect==='light';
    strikeOverlay.classList.toggle('chapel-illumination',illumination);
    slash.hidden=illumination;lightRay.hidden=!illumination;
    strikeOverlay.hidden=false;slash.style.opacity='0';
    if(illumination){
      await Promise.all([
        play(lightRay,[{opacity:0,transform:'rotate(22deg) scaleX(.15)'},{opacity:.95,transform:'rotate(22deg) scaleX(1)',offset:.45},{opacity:0,transform:'rotate(22deg) scaleX(5)'}],{duration:1200,fill:'forwards',easing:'ease-in'}),
        play(strikeOverlay,[{opacity:1,backgroundColor:'rgba(255,246,215,0)'},{opacity:1,backgroundColor:'rgba(255,246,215,.22)',offset:.45},{opacity:1,backgroundColor:'#fffaf0'}],{duration:1200,fill:'forwards',easing:'ease-in'})
      ]);
    }else{
      await play(strikeOverlay,[{opacity:0},{opacity:1}],{duration:140,fill:'forwards'});
      await play(slash,[{opacity:0,transform:'rotate(-24deg) scaleX(0)'},{opacity:1,transform:'rotate(-24deg) scaleX(1)',offset:.45},{opacity:0,transform:'rotate(-24deg) scaleX(1.08)'}],{duration:380,fill:'forwards',easing:'ease-out'});
    }
    if(revision!==strikeRevision)return;
    go(next.id,true);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(revision!==strikeRevision)return;
    await play(strikeOverlay,[{opacity:1},{opacity:0}],{duration:illumination?1000:650,fill:'forwards',easing:'ease-out'});
  }catch(error){if(error.name!=='AbortError')console.error('Strike transition failed',error);}
  finally{if(revision===strikeRevision)cancelStrike();}
}
function go(id,fromStrike=false){if(!fromStrike)cancelStrike();state=core.move(state,id,story);render();}
function advance(){
  if(striking||!state||$('panel').open||$('reader').hidden)return;
  if(!typed){finishText();return;}
  if(document.body.classList.contains('art-only')){showText(true);return;}
  const n=node();if(n.kind==='choice')return;
  const next=story.nodes[index.get(n.id)+1];
  if(next&&n.source===360&&next.source===364&&!prefs.reducedMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches){strikeTo(next);return;}
  if(next&&n.source===522&&next.source===524&&!prefs.reducedMotion&&!matchMedia('(prefers-reduced-motion: reduce)').matches){strikeTo(next,'light');return;}
  if(next)go(next.id);
}
function previous(){if(!state||state.cursor===0)return;cancelStrike();stopAuto();state=core.back(state);render();}
$('previous-passage').onclick=previous;
function home(){cancelStrike();stopTimers();stopAuto();$('ending-video').pause();showText(true);showScreen('title-screen');$('resume-button').hidden=!state;}
function showEnding(){
  stopAuto();showScreen('ending-screen');
  const film=$('ending-video');if(!film.getAttribute('src'))film.src=story.nodes.find(beat=>beat.kind==='ending').video;
  film.currentTime=0;film.controls=false;
  $('pause-film').disabled=false;
  $('video-message').textContent='';$('play-film').hidden=true;
  playFilm();
}
function playFilm(){
  const film=$('ending-video');
  film.play().then(()=>{$('play-film').hidden=true;$('video-message').textContent='';}).catch(()=>{if($('ending-screen').hidden)return;$('play-film').hidden=false;$('play-film').textContent='Start film';$('video-message').textContent='Select Start film to begin.';});
}
$('ending-video').addEventListener('error',()=>{$('play-film').hidden=true;$('video-message').textContent='The film could not load. Select End to return to the title.';});
$('ending-video').addEventListener('ended',()=>{$('play-film').hidden=true;$('video-message').textContent='The prologue is complete. The story is only beginning.';});
$('play-film').onclick=playFilm;
$('pause-film').onclick=()=>{const film=$('ending-video');if(film.paused)playFilm();else film.pause();};
function syncFilmPause(){const film=$('ending-video');$('pause-film').textContent=film.paused?'Resume':'Pause';$('pause-film').disabled=film.ended;}
for(const event of ['play','pause','ended'])$('ending-video').addEventListener(event,syncFilmPause);
$('ending-home').onclick=home;
$('next-button').onclick=advance;$('back-button').onclick=previous;
$('story-text').onclick=()=>{if(!getSelection()?.toString())advance();};
$('stage').onclick=e=>{if(e.target.closest('button'))return;advance();};
$('hide-text').onclick=()=>{stopAuto();showText(false);};$('show-text').onclick=()=>showText(true);
$('auto-button').onclick=()=>{auto=!auto;$('auto-button').setAttribute('aria-pressed',String(auto));$('auto-button').textContent=auto?'Auto · on':'Auto';if(auto&&typed)scheduleAuto();else clearTimeout(autoTimer);};
$('home-button').onclick=home;
$('resume-button').onclick=()=>{prefs.name=state.name;applyPrefs();render();};
$('quick-save').onclick=()=>{if(state){slots[0]=structuredClone(state);if(write('-slots',slots))toast('Saved to slot 1.');}};
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function button(text,action,className){const e=element('button',text,className);e.onclick=action;return e;}
function closePanel(){$('panel').close();scheduleAuto();}
function openPanel(title){clearTimeout(autoTimer);$('panel-title').textContent=title;$('panel-content').replaceChildren();if(!$('panel').open)$('panel').showModal();return $('panel-content');}
$('close-panel').onclick=closePanel;
$('panel').addEventListener('click',e=>{if(e.target===$('panel')){const r=$('panel').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();}});
$('panel').addEventListener('close',()=>scheduleAuto());
$('begin-button').onclick=()=>{
  const panel=openPanel('Before the first page');
  panel.append(element('p','What should the story call you?'));
  const label=element('label',undefined,'setting');label.append(element('span','Your name'));
  const input=element('input');input.type='text';input.maxLength=32;input.value=prefs.name;input.autocomplete='off';label.append(input);panel.append(label);
  panel.append(element('p','A new reading starts at the beginning. Your manual save slots stay available.','muted'));
  const start=()=>{prefs.name=core.settings({name:input.value}).name;write('-settings',prefs);state=core.create(story,prefs.name);closePanel();render();};
  panel.append(button('Begin prologue',start,'primary'));input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();start();}});input.focus();input.select();
};
function chaptersPanel(){
  const panel=openPanel('Chapters & opening');panel.append(element('p','Read from the beginning, jump to a chapter, or watch the opening.','muted'));
  const list=element('div',undefined,'chapter-list');
  for(const chapter of story.chapters){
    const b=button('',()=>{if(!state)state=core.create(story,prefs.name);closePanel();go(chapter.start);},'chapter-link');
    const img=element('img');img.src=imagePath(chapter.cover);img.alt='';img.loading='lazy';
    const text=element('span');text.append(element('small',`PART ${String(chapter.id).padStart(2,'0')}`),element('strong',chapter.title));
    b.append(img,text,element('span','→','arrow'));list.append(b);
  }
  const opening=button('',()=>{closePanel();cancelStrike();stopTimers();showEnding();},'chapter-link');
  const openingImage=element('img');openingImage.src=imagePath('0-01-011');openingImage.alt='';openingImage.loading='lazy';
  const openingText=element('span');openingText.append(element('small','FILM'),element('strong','Opening'));
  opening.append(openingImage,openingText,element('span','→','arrow'));list.append(opening);
  panel.append(list);
}
function historyPanel(){
  const panel=openPanel('Reading history');
  if(!state){panel.append(element('p','Your reading history will appear here.','muted'));return;}
  const ids=state.trail.slice(0,state.cursor+1);
  for(let i=0;i<ids.length;i++){
    const n=story.nodes[index.get(ids[i])];if(!n.text||['chapter','ending'].includes(n.kind))continue;
    const entry=element('div',undefined,'history-entry '+n.kind);
    entry.append(button((n.speaker==='You'?prefs.name:n.speaker||n.location)+' · return here',()=>{state={...state,nodeId:n.id,cursor:i};closePanel();render();}),element('p',core.display(n.text,prefs.name)));
    panel.append(entry);
  }
  requestAnimationFrame(()=>{$('panel').scrollTop=$('panel').scrollHeight;});
}
function saveSummary(save){
  try{const valid=core.validate(save,story),n=story.nodes[index.get(valid.nodeId)];return `${valid.name} · Part ${n.part} · ${new Date(valid.savedAt).toLocaleString()}`;}catch{return 'Empty or incompatible';}
}
function loadSave(save){try{state=core.validate(save,story);prefs.name=state.name;write('-settings',prefs);closePanel();render();}catch(e){toast(e.message);}}
function savesPanel(){
  const panel=openPanel('Save your place');
  panel.append(element('p','Autosave remembers your current passage. Manual slots keep a separate bookmark.','muted'));
  for(let i=0;i<3;i++){
    const row=element('div',undefined,'save-slot'),info=element('div'),actions=element('div');
    info.append(element('strong',`Slot ${i+1}`),element('small',slots[i]?saveSummary(slots[i]):'Empty'));
    const save=button(slots[i]?'Overwrite':'Save',()=>{if(!state)return;slots[i]=structuredClone(state);if(write('-slots',slots))toast(`Saved to slot ${i+1}.`);savesPanel();});save.disabled=!state;
    const load=button('Load',()=>loadSave(slots[i]));load.disabled=!slots[i];actions.append(save,load);row.append(info,actions);panel.append(row);
  }
  const tools=element('div',undefined,'save-tools');
  const exportButton=button('Export current save',()=>{
    if(!state)return;const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download='casanova-prologue-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });exportButton.disabled=!state;
  const file=element('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
  file.onchange=async()=>{const f=file.files[0];if(!f)return;try{if(f.size>1024*1024)throw new Error('That file is too large to be a save.');loadSave(JSON.parse(await f.text()));}catch(e){toast(e.message==='Unexpected token'?'This is not a valid save file.':e.message);}file.value='';};
  tools.append(exportButton,button('Import save',()=>file.click()),file);panel.append(tools);
}
function settingsPanel(){
  const panel=openPanel('Reading settings');
  function setting(title,description,input){const label=element('label',undefined,'setting'),text=element('span',title);text.append(element('small',description));label.append(text,input);panel.append(label);}
  function change(){write('-settings',prefs);applyPrefs();if(state){state.name=prefs.name;persist();if(!$('reader').hidden)render();}}
  const name=element('input');name.type='text';name.value=prefs.name;name.maxLength=32;name.onchange=()=>{prefs.name=core.settings({name:name.value}).name;change();};setting('Your name','Used in dialogue and introductions.',name);
  function range(title,description,key,min,max){const input=element('input');input.type='range';input.min=min;input.max=max;input.value=prefs[key];input.oninput=()=>{prefs[key]=Number(input.value);change();};setting(title,description,input);}
  range('Text size','Make the story comfortable to read.','fontSize',17,32);
  const speed=element('select');for(const [value,label] of [[0,'Instant'],[25,'Slow'],[45,'Medium'],[70,'Fast']]){const option=element('option',label);option.value=value;speed.append(option);}speed.value=prefs.textSpeed;speed.onchange=()=>{prefs.textSpeed=Number(speed.value);change();};setting('Text reveal','Click once to finish a revealing line.',speed);
  range('Auto pause','Minimum pause; longer passages get more time.','autoDelay',1,12);
  for(const [key,title,desc] of [['reducedMotion','Reduce motion','Disable pans, pulses, and the brief disguise flicker.'],['sans','Simple typeface','Use a sans-serif font for story text.']]){const input=element('input');input.type='checkbox';input.checked=prefs[key];input.onchange=()=>{prefs[key]=input.checked;change();};setting(title,desc,input);}
  panel.append(element('p','D / Space / Enter / →: advance · A / ←: previous passage · H: hide or show text · Esc: close a panel. Auto pauses at actions and choices.','help'));
}
for(const b of document.querySelectorAll('[data-panel]'))b.onclick=()=>({chapters:chaptersPanel,history:historyPanel,saves:savesPanel,settings:settingsPanel}[b.dataset.panel]());
document.addEventListener('keydown',e=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||$('panel').open||e.target.isContentEditable||e.target.closest('input,select,textarea,video'))return;
  if(e.target.closest('button')&&[' ','Enter'].includes(e.key))return;
  if($('reader').hidden)return;
  if([' ','Enter','ArrowRight'].includes(e.key)||e.key.toLowerCase()==='d'){e.preventDefault();advance();}
  else if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a'){e.preventDefault();previous();}
  else if(e.key.toLowerCase()==='h'){e.preventDefault();stopAuto();showText(document.body.classList.contains('art-only'));}
});
let resumeFilmOnVisible=false;
document.addEventListener('visibilitychange',()=>{const film=$('ending-video');if(document.hidden){clearTimeout(autoTimer);resumeFilmOnVisible=!$('ending-screen').hidden&&!film.paused&&!film.ended;film.pause();}else if(resumeFilmOnVisible&&!$('ending-screen').hidden&&!film.ended){resumeFilmOnVisible=false;playFilm();}else scheduleAuto();});
window.addEventListener('pagehide',persist);
applyPrefs();home();
})();
