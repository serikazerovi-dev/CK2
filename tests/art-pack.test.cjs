const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createDecipheriv,createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'assets/packs/index.json'),'utf8'));
const pack=fs.readFileSync(path.join(root,config.pack.split('?')[0]));
function decrypt(entry,bytes){
  const decipher=createDecipheriv('aes-256-gcm',Buffer.from(config.key,'base64'),Buffer.from(entry.iv,'base64'));
  decipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([decipher.update(bytes.subarray(0,-16)),decipher.final()]);
}
test('every packed image authenticates and matches its original hash',()=>{
  let offset=0;
  for(const [name,entry] of Object.entries(config.entries)){
    assert.equal(entry.offset,offset);offset+=entry.length;
    const plain=decrypt(entry,pack.subarray(entry.offset,offset));
    assert.equal(plain.toString('ascii',0,4),'RIFF');
    assert.equal(plain.toString('ascii',8,12),'WEBP');
    assert.equal(createHash('sha256').update(plain).digest('hex'),entry.sha256,name);
    assert.ok(!fs.existsSync(path.join(root,name)),`Unpacked image exposed: ${name}`);
  }
  assert.equal(offset,pack.length);
});
test('corrupted encrypted artwork fails authentication',()=>{
  const entry=Object.values(config.entries)[0];
  const damaged=Buffer.from(pack.subarray(entry.offset,entry.offset+entry.length));damaged[0]^=1;
  assert.throws(()=>decrypt(entry,damaged));
});
