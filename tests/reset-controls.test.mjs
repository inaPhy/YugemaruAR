import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Placement} from '../dist/placement.mjs';
import {DEFAULT_MODEL_YAW,beyondMarker} from '../dist/model-pose.mjs';
test('soft reset clears transforms and gestures, recenters, rejects stale QR and uses fresh placement',async()=>{
 const THREE=await import('../dist/vendor/three/three.module.js');
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:''});return nodes.get(id);};
 let recentered=0,gesturesCleared=0,reloaded=0;
 const camera=new THREE.PerspectiveCamera();camera.position.set(0,2,0);camera.updateMatrixWorld();
 const context=vm.createContext({window:{},document:{getElementById:get,querySelectorAll:()=>[]},THREE,Placement,DEFAULT_MODEL_YAW,beyondMarker,camera,bindModelGestures:()=>()=>gesturesCleared++,location:{reload(){reloaded++;}},recenter(){recentered++;}});
 const source=readFileSync(new URL('../dist/ar.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').split('function loadEngine()')[0];
 vm.runInContext(source+`
anchor=new THREE.Group();visual=new THREE.Group();anchor.add(visual);modelReady=true;xr={Threejs:{xrScene:()=>({camera})},XrController:{recenter}};size=2.5;angle=5;controls();anchor.position.set(10,4,9);anchor.rotation.set(1,2,3);anchor.scale.setScalar(4);`,context);
 get('reset').onclick();
 assert.equal(reloaded,0);assert.equal(recentered,1);assert.equal(gesturesCleared,1);
 assert.equal(vm.runInContext('size',context),1);assert.equal(vm.runInContext('visual.rotation.y',context),DEFAULT_MODEL_YAW);
 assert.equal(vm.runInContext('anchor.scale.x',context),1);assert.equal(vm.runInContext('anchor.position.length()',context),0);
 assert.equal(vm.runInContext('anchor.quaternion.w',context),1);
 const event={detail:{name:'yugemaru-qr',position:{x:0,y:1,z:-3},rotation:{x:0,y:0,z:0,w:1}}};context.event=event;
 vm.runInContext('receive(event)',context);assert.equal(vm.runInContext('placement.pose',context),null);
 vm.runInContext('pipeline(null).onUpdate({});receive(event)',context);
 assert.equal(vm.runInContext('anchor.visible',context),true);assert.equal(vm.runInContext('anchor.position.z',context),-5);
 vm.runInContext('size=1.8;angle=2;controls();loseMarker(event);receive(event)',context);
 assert.equal(vm.runInContext('size',context),1.8);assert.equal(vm.runInContext('angle',context),2);
 get('reset').onclick();assert.equal(recentered,2);assert.equal(vm.runInContext('size',context),1);
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
