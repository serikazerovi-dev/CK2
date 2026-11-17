(function(root){
  'use strict';
  const DEFAULTS = {name:'Crow',fontSize:23,textSpeed:45,autoDelay:3,reducedMotion:false,sans:false};
  function settings(value={}) {
    const number=(v,min,max,fallback)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
    return {name:typeof value.name==='string'?value.name.trim().replace(/[\x00-\x1f]/g,'').slice(0,32)||DEFAULTS.name:DEFAULTS.name,
      fontSize:number(value.fontSize,17,32,23),textSpeed:number(value.textSpeed,0,80,DEFAULTS.textSpeed),autoDelay:number(value.autoDelay,1,12,3),
      reducedMotion:value.reducedMotion===true,sans:value.sans===true};
  }
  function create(story,name=DEFAULTS.name) {
    return {version:story.version,nodeId:story.nodes[0].id,trail:[story.nodes[0].id],cursor:0,seen:[story.nodes[0].id],name:settings({name}).name,savedAt:new Date().toISOString()};
  }
  function validate(value,story) {
    if(!value || (value.version!==story.version && !(story.compatibleVersions||[]).includes(value.version))) throw new Error('This save belongs to a different edition of the story.');
    const ids=new Set(story.nodes.map(n=>n.id));
    if(!ids.has(value.nodeId)||!Array.isArray(value.trail)||value.trail.length<1||value.trail.length>20000||!value.trail.every(id=>ids.has(id))) throw new Error('The save has an invalid reading position.');
    if(!Number.isInteger(value.cursor)||value.cursor<0||value.cursor>=value.trail.length||value.trail[value.cursor]!==value.nodeId) throw new Error('The save history is invalid.');
    return {version:story.version,nodeId:value.nodeId,trail:[...value.trail],cursor:value.cursor,
      seen:[...new Set((Array.isArray(value.seen)?value.seen:[]).filter(id=>ids.has(id)).concat(value.nodeId))],
      name:settings({name:value.name}).name,savedAt:typeof value.savedAt==='string'?value.savedAt:new Date().toISOString()};
  }
  function move(state,id,story) {
    if(!story.nodes.some(n=>n.id===id)) throw new Error('Unknown passage.');
    return {...state,nodeId:id,trail:[...state.trail.slice(0,state.cursor+1),id],cursor:state.cursor+1,
      seen:[...new Set([...state.seen,id])],savedAt:new Date().toISOString()};
  }
  function back(state) {
    if(state.cursor===0)return state;
    const cursor=state.cursor-1;
    return {...state,cursor,nodeId:state.trail[cursor],savedAt:new Date().toISOString()};
  }
  function display(text,name) {
    return text.replace(/MC-NAME/g,name).replace(/\bMC Pendragon\b/g,name+' Pendragon').replace(/\bMC\b/g,name);
  }
  const api={DEFAULTS,settings,create,validate,move,back,display};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.ReaderCore=api;
})(typeof window!=='undefined'?window:globalThis);
