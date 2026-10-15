import {test} from 'node:test';
import assert from 'node:assert/strict';
import {behindCamera,DEFAULT_MODEL_YAW} from '../dist/model-pose.mjs';
test('default is a quarter-turn side view',()=>assert.equal(DEFAULT_MODEL_YAW,Math.PI/2));
test('behind camera, not beyond marker; preserves marker height',()=>assert.deepEqual(behindCamera({x:0,y:.4,z:-1},{x:0,y:1.6,z:2},{x:0,y:-.5,z:-.8}),{x:0,y:.4,z:4}));
test('behind follows horizontal camera heading',()=>assert.deepEqual(behindCamera({x:3,y:0,z:4},{x:0,y:2,z:0},{x:1,y:0,z:0}),{x:-2,y:0,z:0}));
test('looking straight down uses marker bearing then finite fallback',()=>assert.deepEqual(behindCamera({x:0,y:0,z:0},{x:0,y:2,z:0},{x:0,y:-1,z:0}),{x:0,y:0,z:2}));
