import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../dist/vendor/three/three.module.js';
import {ModelGrowth} from '../dist/growth.mjs';
import {Placement} from '../dist/placement.mjs';
import {DEFAULT_MODEL_YAW} from '../dist/model-pose.mjs';
const full=readFileSync(new URL('../dist/ar.js',import.meta.url),'utf8');
test('world tracking enabled; reset never recenters camera',()=>{
 assert.match(full,/disableWorldTracking:false/);assert.match(full,/scale:'responsive'/);
 assert.match(full,/await requestMotionPermission\(\)/);assert.doesNotMatch(full,/\.recenter\(/);
});
test('QR center and width drive placement; loss holds; reset restores transform without reload',()=>{
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:''});return nodes.get(id);};let cleared=0;
 const context=vm.createContext({window:{},document:{getElementById:get,querySelectorAll:()=>[]},THREE,Placement,ModelGrowth,performance:{now:()=>0},DEFAULT_MODEL_YAW,bindModelGestures:()=>()=>cleared++});
 vm.runInContext(full.replace(/^import .*;\n/gm,'').split('function loadEngine()')[0]+`\nxr={Threejs:{xrScene:()=>({camera:new THREE.PerspectiveCamera()})}};anchor=new THREE.Group();visual=new THREE.Group();anchor.add(visual);modelReady=true;size=2;angle=4;controls();`,context);
 context.event={detail:{name:'yugemaru-qr',position:{x:0,y:2,z:-3},rotation:{x:0,y:0,z:0,w:1},scale:.5,scaledWidth:.8}};
 vm.runInContext('receive(event)',context);
 assert.equal(vm.runInContext('anchor.position.x',context),0);assert.equal(vm.runInContext('anchor.position.z',context),-3);assert.equal(vm.runInContext('anchor.scale.x',context),.2);
 vm.runInContext('loseMarker(event)',context);assert.equal(vm.runInContext('anchor.visible',context),true);
 assert.equal(vm.runInContext('anchor.position.z',context),-3);assert.equal(vm.runInContext('anchor.scale.x',context),.2);
 vm.runInContext('performance.now=()=>5000;pipeline(null).onUpdate({});',context);
 assert.equal(vm.runInContext('anchor.scale.x',context),6);
 vm.runInContext('event.detail.position.z=-7;receive(event);',context);
 assert.equal(vm.runInContext('anchor.scale.x',context),6);assert.equal(vm.runInContext('anchor.position.z',context),-7);
 get('reset').onclick();assert.equal(vm.runInContext('anchor.visible',context),false);assert.equal(cleared,1);assert.equal(vm.runInContext('size',context),1);assert.equal(vm.runInContext('visual.rotation.y',context),DEFAULT_MODEL_YAW);
 vm.runInContext('receive(event)',context);assert.equal(vm.runInContext('anchor.visible',context),true);assert.equal(vm.runInContext('anchor.scale.x',context),.2);
});
