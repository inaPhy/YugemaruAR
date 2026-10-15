import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Group,AnimationClip,QuaternionKeyframeTrack,VectorKeyframeTrack,PropertyBinding} from '../dist/vendor/three/three.module.js';
import {ModelAnimation} from '../dist/model-animation.mjs';
function authoredAnimation(){
 const b=readFileSync(new URL('../dist/assets/yugemaru.glb',import.meta.url));
 const jsonLength=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+jsonLength)),bin=28+jsonLength;
 const values=i=>{const a=g.accessors[i],v=g.bufferViews[a.bufferView],width={SCALAR:1,VEC3:3,VEC4:4}[a.type];assert.equal(a.componentType,5126);assert.equal(v.byteStride,undefined);return Array.from({length:a.count*width},(_,k)=>b.readFloatLE(bin+(v.byteOffset||0)+(a.byteOffset||0)+k*4));};
 const root=new Group(),nodes=new Map(),tracks=[];
 for(const c of g.animations[0].channels){
  const n=g.nodes[c.target.node],name=PropertyBinding.sanitizeNodeName(n.name);
  if(!nodes.has(name)){const node=new Group();node.name=name;root.add(node);nodes.set(name,node);}
  const sampler=g.animations[0].samplers[c.sampler],type=c.target.path==='rotation'?QuaternionKeyframeTrack:VectorKeyframeTrack;
  tracks.push(new type(`${name}.${{rotation:'quaternion',translation:'position',scale:'scale'}[c.target.path]}`,values(sampler.input),values(sampler.output)));
 }
 return {root,nodes,clip:new AnimationClip(g.animations[0].name,-1,tracks)};
}
test('actual GLB authored rotation tracks animate, while outer placement stays unchanged',()=>{
 const {root,nodes,clip}=authoredAnimation(),outer=new Group();outer.position.set(1,2,3);outer.scale.setScalar(5);outer.add(root);
 const player=new ModelAnimation(root,[clip]);player.update(0);player.update(100);
 const rotations=[...nodes.values()].map(n=>n.quaternion.clone());player.update(200);
 assert.equal(nodes.size,3);assert.ok([...nodes.values()].every((n,i)=>n.quaternion.angleTo(rotations[i])>1e-5));
 assert.deepEqual(outer.position.toArray(),[1,2,3]);assert.equal(outer.scale.x,5);
 const time=player.mixer.time;player.pause();player.update(10000);assert.equal(player.mixer.time,time);
 player.update(10100);assert.ok(player.mixer.time>time);
 player.dispose();assert.equal(player.mixer.stats.actions.inUse,0);
});
test('invisible model does not advance animation; repeated frames do not duplicate actions',()=>{
 const {root,clip}=authoredAnimation(),player=new ModelAnimation(root,[clip]);player.update(0);player.update(100);const time=player.mixer.time;
 player.update(200,false);player.update(5000);assert.equal(player.mixer.time,time);
 for(let i=1;i<=20;i++)player.update(5000+i*16);
 assert.equal(player.mixer.stats.actions.total,1);
});
