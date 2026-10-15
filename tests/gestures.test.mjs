import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ModelGesture} from '../dist/gestures.mjs';
const p=(id,x,y=0)=>({id,x,y});
test('pinch scales proportionally, keeps rotation, and clamps size',()=>{const g=new ModelGesture();g.update([p(1,0),p(2,100)],1,.5,400);assert.deepEqual(g.update([p(1,0),p(2,200)],1,.5,400),{scale:2,angle:.5});assert.equal(g.update([p(1,0),p(2,1000)],2,.5,400).scale,3);assert.equal(g.update([p(1,0),p(2,10)],3,.5,400).scale,.3);});
test('one finger horizontal swipe rotates without changing scale',()=>{const g=new ModelGesture();g.update([p(1,0)],1,0,400);assert.equal(g.update([p(1,100)],1,0,400).angle,Math.PI/2);assert.deepEqual(g.update([p(1,100,90)],1,Math.PI/2,400),{scale:1,angle:Math.PI/2});});
test('changing finger count or identity does not jump',()=>{const g=new ModelGesture();g.update([p(1,0)],1,0,400);assert.deepEqual(g.update([p(1,100),p(2,300)],1,0,400),{scale:1,angle:0});assert.deepEqual(g.update([p(2,300)],1,0,400),{scale:1,angle:0});g.reset();assert.deepEqual(g.update([p(3,600)],1,0,400),{scale:1,angle:0});});
