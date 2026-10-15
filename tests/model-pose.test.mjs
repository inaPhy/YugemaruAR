import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beyondMarker,DEFAULT_MODEL_YAW} from '../dist/model-pose.mjs';
test('default is a quarter-turn side view',()=>assert.equal(DEFAULT_MODEL_YAW,Math.PI/2));
test('places 2m beyond marker along ground, preserves marker height',()=>{const point=beyondMarker({x:0,y:.4,z:-1},{x:0,y:1.6,z:2});assert.deepEqual(point,{x:0,y:.4,z:-3});});
test('offset responds to viewing direction, not fixed global depth',()=>{const point=beyondMarker({x:3,y:0,z:4},{x:0,y:2,z:0});assert.ok(Math.abs(Math.hypot(point.x-3,point.z-4)-2)<1e-10);assert.equal(point.x,4.2);assert.equal(point.z,5.6);});
test('camera directly above marker uses finite horizontal fallback',()=>{assert.deepEqual(beyondMarker({x:0,y:0,z:0},{x:0,y:2,z:0},{x:0,y:-1,z:0}),{x:0,y:0,z:-2});});
