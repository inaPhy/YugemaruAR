import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Placement} from '../dist/placement.mjs';
const pose=(x=1)=>({name:'yugemaru-qr',position:{x,y:2,z:3},rotation:{x:0,y:0,z:0,w:1},scale:1});
const place=p=>{let result;for(let i=0;i<7;i++)result=p.observe(pose(),true,i*100)||result;return result;};
test('QR loss and subsequent movement do not move or remove the world placement',()=>{const p=new Placement();const initial=place(p);assert.ok(initial);p.lost();assert.deepEqual(p.pose,initial);assert.equal(p.observe(pose(50),true,1000),null);assert.deepEqual(p.pose.position,{x:1,y:2,z:3});});
test('placement waits for world tracking and a stable QR observation',()=>{const p=new Placement();for(let i=0;i<10;i++)assert.equal(p.observe(pose(),false,i*100),null);for(let i=0;i<10;i++)assert.equal(p.observe(pose(i),true,1000+i*100),null);assert.equal(p.pose,null);});
test('losing QR before placement restarts stability window',()=>{const p=new Placement();for(let i=0;i<4;i++)p.observe(pose(),true,i*100);p.lost();assert.equal(p.observe(pose(),true,600),null);assert.equal(p.pose,null);});
test('reset explicitly allows a new origin, invalid poses are rejected',()=>{const p=new Placement();place(p);p.reset();assert.equal(p.pose,null);assert.equal(p.observe({...pose(),scale:NaN},true,0),null);assert.equal(p.observe({...pose(),name:'another-qr'},true,0),null);assert.ok(place(p));});
