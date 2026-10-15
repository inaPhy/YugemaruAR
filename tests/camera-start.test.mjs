import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/camera-start.js',import.meta.url),'utf8');
test('camera request runs on load without any motion interaction; stream released',async()=>{let calls=0,stops=0;const window={isSecureContext:true,addEventListener(){}};vm.runInNewContext(source,{window,navigator:{mediaDevices:{getUserMedia:async options=>{calls++;assert.equal(options.audio,false);return {getTracks:()=>[{stop(){stops++;}}]};}}}});assert.equal(calls,1);assert.equal((await window.initialCameraPermission).ok,true);window.releaseInitialCamera();window.releaseInitialCamera();assert.equal(stops,1);});
test('denied camera permission is a handled result',async()=>{const window={isSecureContext:true,addEventListener(){}};vm.runInNewContext(source,{window,navigator:{mediaDevices:{getUserMedia:async()=>{throw {name:'NotAllowedError'};}}}});assert.equal((await window.initialCameraPermission).name,'NotAllowedError');});
