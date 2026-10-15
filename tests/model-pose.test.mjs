import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_MODEL_YAW} from '../dist/model-pose.mjs';
test('default is side view',()=>assert.equal(DEFAULT_MODEL_YAW,Math.PI/2));
import {beyondQr} from '../dist/model-pose.mjs';
test('offset is five QR widths horizontally and keeps marker height',()=>{
 assert.deepEqual(beyondQr({x:0,y:1,z:-3},{x:0,y:2,z:0},.4),{x:0,y:1,z:-5});
 const p=beyondQr({x:3,y:.7,z:4},{x:0,y:2,z:0},.2);
 assert.ok(Math.abs(Math.hypot(p.x-3,p.z-4)-1)<1e-10);assert.equal(p.y,.7);
});
test('overhead camera has finite fallback',()=>assert.deepEqual(beyondQr({x:0,y:0,z:0},{x:0,y:2,z:0},.1,{x:0,z:0}),{x:0,y:0,z:-.5}));
