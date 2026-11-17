/* Decode and flatten concealment before any sprite enters the visible stage. */
(function(root){
  'use strict';
  const cache=new Map();
  function prepare(name,visibility='full'){
    const key=name+':'+visibility;
    if(!cache.has(key)){
      const task=(async()=>{
        const source=new Image();
        // Concealed variants are flattened at build time, including their alpha.
        await root.AssetArt.ready;
        source.src=root.AssetArt.url('assets/sprites/'+name+(visibility==='full'?'':'-'+visibility)+'.webp');
        await source.decode();
        return source;
      })();
      cache.set(key,task);
      task.catch(()=>{if(cache.get(key)===task)cache.delete(key);});
    }
    return cache.get(key);
  }
  function createPresenter({prepare,hide,commit,onError=()=>{}}){
    let revision=0,currentKey=null;
    return async function present(spec){
      const key=JSON.stringify(spec);
      if(key===currentKey)return;
      currentKey=key;const ticket=++revision;
      // Never leave the previous identity visible beside the next speaker.
      hide();
      try{
        const images=await Promise.all(spec.map(item=>item?prepare(item.name,item.visibility):null));
        if(ticket===revision)commit(images,spec);
      }catch(error){
        if(ticket===revision){currentKey=null;onError(error);}
      }
    };
  }
  const api={prepare,createPresenter};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SpriteArt=api;
})(typeof window!=='undefined'?window:globalThis);
