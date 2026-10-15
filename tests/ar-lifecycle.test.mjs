import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../dist/vendor/three/three.module.js';
import {Placement} from '../dist/placement.mjs';
import {DEFAULT_MODEL_YAW} from '../dist/model-pose.mjs';
const source=readFileSync(new URL('../dist/ar.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/start\(\);\s*$/,'');
function setup(){
 const handlers={},nodes=new Map(),counts={stop:0,pause:0,resume:0};
 const get=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:'',classList:{add(){}}});return nodes.get(id);};
 const document={hidden:false,getElementById:get,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f};
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 const engine={stop(){counts.stop++;},pause(){counts.pause++;},resume(){counts.resume++;},Threejs:{xrScene:()=>({scene,camera,renderer:{}})},XrController:{updateCameraProjectionMatrix(){}}};
 const context=vm.createContext({THREE,Placement,DEFAULT_MODEL_YAW,window:{addEventListener:(n,f)=>handlers[n]=f,releaseInitialCamera(){}},document,bindModelGestures:()=>()=>{},engine,console});
 vm.runInContext(source+'\nxr=engine;',context);
 return {context,document,handlers,counts,scene};
}
test('error stops engine once and never resumes in background/foreground',()=>{
 const s=setup();vm.runInContext('running=true;fail("failed");fail("again");',s.context);
 s.handlers.visibilitychange();assert.equal(s.counts.stop,1);assert.equal(s.counts.resume,0);
});
test('engine starting after tab hides pauses immediately; repeated onStart does not duplicate scene',()=>{
 const s=setup();s.document.hidden=true;
 vm.runInContext('pipeline(new THREE.Group()).onStart();',s.context);
 assert.equal(s.counts.pause,1);const children=s.scene.children.length;
 vm.runInContext('pipeline(new THREE.Group()).onStart();',s.context);assert.equal(s.scene.children.length,children);
 s.document.hidden=false;s.handlers.visibilitychange();assert.equal(s.counts.resume,1);
 s.handlers.pagehide();s.handlers.visibilitychange();assert.equal(s.counts.stop,1);assert.equal(s.counts.resume,1);
});
test('late startup after leaving page stops instead of creating scene',()=>{
 const s=setup();s.handlers.pagehide();vm.runInContext('pipeline(new THREE.Group()).onStart();',s.context);
 assert.equal(s.scene.children.length,0);assert.equal(s.counts.stop,2);
});
