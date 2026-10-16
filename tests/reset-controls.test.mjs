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
test('visible or reacquired QR tracks continuously; reset only restores initial appearance and growth',()=>{
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},textContent:''});return nodes.get(id);};let cleared=0;
 const context=vm.createContext({window:{},innerWidth:390,innerHeight:844,document:{getElementById:get},THREE,Placement,ModelGrowth,performance:{now:()=>0},DEFAULT_MODEL_YAW,bindModelGestures:()=>()=>cleared++});
 vm.runInContext(full.replace(/^import .*;\n/gm,'').split('function loadEngine()')[0]+`
xr={Threejs:{xrScene:()=>({camera:new THREE.PerspectiveCamera(60,390/844,.01,100)})}};anchor=new THREE.Group();visual=new THREE.Group();anchor.add(visual);modelReady=true;`,context);
 context.event={detail:{name:'yugemaru-qr',position:{x:0,y:0,z:-3},rotation:{x:0,y:0,z:0,w:1},scale:.5,scaledWidth:.8}};
 vm.runInContext('receive(event)',context);
 assert.equal(get('reset').hidden,true);assert.equal(vm.runInContext('anchor.scale.x',context),.2);
 vm.runInContext('performance.now=()=>5000;pipeline(null).onUpdate({});loseMarker(event);',context);
 assert.equal(vm.runInContext('anchor.scale.x',context),6);assert.equal(get('reset').hidden,true);
 vm.runInContext('event.detail.position.z=-7;receive(event);',context);
 assert.equal(vm.runInContext('anchor.position.z',context),-7);assert.equal(vm.runInContext('anchor.scale.x',context),6);assert.equal(get('reset').hidden,false);assert.equal(get('reset').style.left,'195px');
 get('reset').onclick();
 assert.equal(vm.runInContext('anchor.position.z',context),-7);assert.equal(vm.runInContext('anchor.scale.x',context),.2);assert.equal(get('reset').hidden,true);assert.equal(cleared,2);
 vm.runInContext('event.detail.position.z=-8;receive(event);',context);assert.equal(vm.runInContext('anchor.position.z',context),-8);assert.equal(get('reset').hidden,true);
 vm.runInContext('loseMarker(event);event.detail.position.z=3;receive(event);',context);assert.equal(vm.runInContext('anchor.position.z',context),3);assert.equal(get('reset').hidden,true);
});
