import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Placement} from '../dist/placement.mjs';
import {DEFAULT_MODEL_YAW,beyondMarker} from '../dist/model-pose.mjs';
test('reset reloads the AR session; a fresh session has no placement or adjusted transform',()=>{
 const source=readFileSync(new URL('../dist/ar.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').split('function pipeline(model)')[0];
 function boot(){
  const nodes=new Map();let reloads=0;
  const get=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);};
  const context=vm.createContext({window:{},document:{getElementById:get},THREE:{},Placement,DEFAULT_MODEL_YAW,beyondMarker,bindModelGestures:()=>()=>{},location:{reload(){reloads++;}}});
  vm.runInContext(source,context);
  return {context,get,reloads:()=>reloads};
 }
 const old=boot();
 vm.runInContext('size=2.8;angle=8;placement.observe({name:"yugemaru-qr",position:{x:3,y:2,z:1},rotation:{x:0,y:0,z:0,w:1}});',old.context);
 old.get('reset').onclick();
 assert.equal(old.reloads(),1);
 const fresh=boot();
 assert.equal(vm.runInContext('size',fresh.context),1);
 assert.equal(vm.runInContext('angle',fresh.context),DEFAULT_MODEL_YAW);
 assert.equal(vm.runInContext('placement.pose',fresh.context),null);
 assert.equal(vm.runInContext('modelReady',fresh.context),false);
});

test('QR prompt follows projected QR, hides on loss and behind camera',async()=>{
 const THREE=await import('../dist/vendor/three/three.module.js');
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:'',classList:{add(){}},setAttribute(){}});return nodes.get(id);};
 const camera=new THREE.PerspectiveCamera(60,1,.01,100);camera.updateMatrixWorld();
 const source=readFileSync(new URL('../dist/ar.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').split('function pipeline(model)')[0];
 const context=vm.createContext({window:{innerWidth:400,innerHeight:800},document:{getElementById:get,querySelectorAll:()=>[]},THREE,Placement,DEFAULT_MODEL_YAW,beyondMarker,bindModelGestures:()=>()=>{},camera});
 vm.runInContext(source+`\nxr={Threejs:{xrScene:()=>({camera})}};placement.observe({name:'yugemaru-qr',position:{x:0,y:0,z:-2},rotation:{x:0,y:0,z:0,w:1}});updateQrPrompt();`,context);
 assert.equal(get('qr-prompt').hidden,false);assert.equal(get('qr-prompt').style.left,'200px');assert.equal(get('qr-prompt').style.top,'400px');
 vm.runInContext('placement.lost();updateQrPrompt();',context);assert.equal(get('qr-prompt').hidden,true);
 vm.runInContext('placement.tracking=true;placement.pose.position.z=2;updateQrPrompt();',context);assert.equal(get('qr-prompt').hidden,true);
});
