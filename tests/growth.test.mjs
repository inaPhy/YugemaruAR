import test from 'node:test';
import assert from 'node:assert/strict';
import {ModelGrowth} from '../dist/growth.mjs';
test('grows from 1 to 30 in exactly five seconds and stops',()=>{
 const g=new ModelGrowth();g.start(100);assert.equal(g.tick(100),1);assert.equal(g.tick(2600),15.5);assert.equal(g.tick(5100),30);assert.equal(g.tick(20000),30);
});
test('reacquisition does not restart; reset does',()=>{
 const g=new ModelGrowth();g.start(0);g.tick(2500);g.start(2500);assert.equal(g.tick(5000),30);g.reset();g.start(6000);assert.equal(g.tick(6000),1);
});
test('background time does not advance animation',()=>{
 const g=new ModelGrowth();g.start(0);assert.equal(g.tick(1000),6.800000000000001);g.pause();g.tick(100000);assert.equal(g.tick(104000),30);
});
