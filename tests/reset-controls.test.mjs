import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Placement} from '../dist/placement.mjs';
import {DEFAULT_MODEL_YAW,beyondMarker} from '../dist/model-pose.mjs';
test('reset restores initial transform on next QR and ordinary reacquisition preserves adjustments',()=>{
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:{add(){}},setAttribute(){}});return nodes.get(id);};
 const source=readFileSync(new URL('../dist/ar.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').split('function pipeline(model)')[0];
 const context=vm.createContext({window:{},document:{getElementById:get,querySelectorAll:()=>[]},THREE:{Vector3:class{}},Placement,DEFAULT_MODEL_YAW,beyondMarker,bindModelGestures:()=>()=>{},location:{}});
 vm.runInContext(source+`\nvisual={scale:{setScalar(v){this.value=v}},rotation:{}};anchor={position:{copy(){}},quaternion:{copy(){}},scale:{setScalar(){}},visible:true};xr={Threejs:{xrScene:()=>({camera:{getWorldPosition:()=>({x:0,y:0,z:2}),getWorldDirection:()=>({x:0,y:0,z:-1})}})}};modelReady=true;`,context);
 const marker={detail:{name:'yugemaru-qr',position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1},scale:1}};
 context.marker=marker;
 vm.runInContext('size=2;angle=3;receive(marker);',context);
 assert.equal(vm.runInContext('size',context),2);
 get('reset').onclick();
 vm.runInContext('size=2.5;angle=4;receive(marker);',context);
 assert.equal(vm.runInContext('size',context),1);
 assert.equal(vm.runInContext('visual.rotation.y',context),DEFAULT_MODEL_YAW);
 vm.runInContext('size=1.5;angle=2;placement.lost("yugemaru-qr");receive(marker);',context);
 assert.equal(vm.runInContext('size',context),1.5);
 assert.equal(vm.runInContext('angle',context),2);
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
