import test from 'node:test';
import assert from 'node:assert/strict';
import {requestMotionPermission} from '../dist/motion-permission.mjs';
test('platform without permission APIs proceeds',async()=>assert.equal(await requestMotionPermission({}),true));
test('requests both sensors synchronously in the same gesture',async()=>{
 const calls=[];const scope={DeviceOrientationEvent:{requestPermission(){calls.push('orientation');return Promise.resolve('granted');}},DeviceMotionEvent:{requestPermission(){calls.push('motion');return Promise.resolve('granted');}}};
 const pending=requestMotionPermission(scope);assert.deepEqual(calls,['orientation','motion']);assert.equal(await pending,true);
});
test('denial or activation error requires explicit permission button',async()=>{
 for(const requestPermission of [()=>Promise.resolve('denied'),()=>{throw Error('gesture required');}])assert.equal(await requestMotionPermission({DeviceMotionEvent:{requestPermission}}),false);
});
