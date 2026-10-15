import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Placement} from '../dist/placement.mjs';
const pose=(x=1)=>({name:'yugemaru-qr',position:{x,y:2,z:3},rotation:{x:0,y:0,z:0,w:1},scale:.09});
test('visible QR continuously updates position and orientation',()=>{const p=new Placement();p.observe(pose());const next={...pose(4),rotation:{x:0,y:1,z:0,w:0}};assert.deepEqual(p.observe(next).position,next.position);assert.deepEqual(p.pose.rotation,next.rotation);assert.equal(p.tracking,true);});
test('loss retains last world pose; reacquisition replaces it',()=>{const p=new Placement();p.observe(pose());p.observe(pose(3));const last=structuredClone(p.pose);p.lost();assert.equal(p.tracking,false);assert.deepEqual(p.pose,last);p.observe(pose(9));assert.equal(p.tracking,true);assert.equal(p.pose.position.x,9);p.lost();assert.equal(p.pose.position.x,9);});
test('invalid or unrelated target cannot replace or lose valid placement',()=>{const p=new Placement();p.observe(pose());const last=structuredClone(p.pose);assert.equal(p.observe({...pose(),position:{x:NaN,y:0,z:0}}),null);assert.equal(p.observe({...pose(),rotation:{x:0,y:0,z:0,w:0}}),null);assert.equal(p.observe({...pose(),name:'other'}),null);p.lost('other');assert.deepEqual(p.pose,last);assert.equal(p.tracking,true);});
test('marker size does not change the meter-based model scale',()=>{const p=new Placement();const first=p.observe(pose());const second=p.observe({...pose(),scale:50});assert.deepEqual(second,first);assert.equal('scale' in second,false);});
test('reset clears placement and tracking',()=>{const p=new Placement();p.observe(pose());p.reset();assert.equal(p.pose,null);assert.equal(p.tracking,false);});
