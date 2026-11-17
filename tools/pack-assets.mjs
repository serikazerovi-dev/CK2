// Input must be a private directory containing cg/ and sprites/ WebP copies.
// Browser encryption is an extraction deterrent, not a secret-key security boundary.
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {randomBytes, createCipheriv, createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv[2])throw new Error('Usage: node tools/pack-assets.mjs PRIVATE_IMAGE_DIRECTORY');
const input=path.resolve(process.argv[2]);
if(input===root||input.startsWith(root+path.sep))throw new Error('Keep unpacked input outside the published site.');
const key=randomBytes(32), entries={}, chunks=[];
let offset=0;
for(const folder of ['cg','sprites']){
  for(const file of (await readdir(path.join(input,folder))).filter(f=>f.endsWith('.webp')).sort()){
    const data=await readFile(path.join(input,folder,file)),iv=randomBytes(12);
    const cipher=createCipheriv('aes-256-gcm',key,iv);
    const encrypted=Buffer.concat([cipher.update(data),cipher.final(),cipher.getAuthTag()]);
    entries[`assets/${folder}/${file}`]={offset,length:encrypted.length,iv:iv.toString('base64'),sha256:createHash('sha256').update(data).digest('hex')};
    chunks.push(encrypted);offset+=encrypted.length;
  }
}
const bytes=Buffer.concat(chunks),version=createHash('sha256').update(bytes).digest('hex').slice(0,16);
const config={version,pack:`assets/packs/art.bin?v=${version}`,key:key.toString('base64'),entries};
await mkdir(path.join(root,'assets/packs'),{recursive:true});
await writeFile(path.join(root,'assets/packs/art.bin'),bytes);
await writeFile(path.join(root,'assets/packs/index.json'),JSON.stringify(config));
await writeFile(path.join(root,'asset-index.js'),'window.ART_PACK='+JSON.stringify(config)+';\n');
console.log(`Packed ${Object.keys(entries).length} images (${bytes.length} encrypted bytes).`);
