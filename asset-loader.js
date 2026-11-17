/* Public browser-side encryption deters casual extraction; it is not DRM. */
(()=>{
  'use strict';
  const urls=new Map(), config=window.ART_PACK;
  const from64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  const status=document.getElementById('asset-status');
  async function load(){
    if(!window.isSecureContext||!crypto.subtle)throw new Error('Open the demo through localhost or HTTPS hosting.');
    const response=await fetch(config.pack);
    if(!response.ok)throw new Error('The artwork pack could not be loaded.');
    const bytes=await response.arrayBuffer();
    const key=await crypto.subtle.importKey('raw',from64(config.key),'AES-GCM',false,['decrypt']);
    const entries=Object.entries(config.entries);let done=0;
    for(const [name,entry] of entries){
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(entry.iv)},key,bytes.slice(entry.offset,entry.offset+entry.length));
      urls.set(name,URL.createObjectURL(new Blob([plain],{type:'image/webp'})));
      status.textContent=`Preparing artwork… ${Math.round(++done/entries.length*100)}%`;
    }
  }
  window.AssetArt={
    ready:load().catch(error=>{
      for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();
      status.textContent=error.message+' Refresh to try again.';
      throw error;
    }),
    url(name){if(!urls.has(name))throw new Error('Artwork is not prepared: '+name);return urls.get(name);}
  };
})();
