import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('direct print waits for QR image and invokes print without navigation',()=>{
 const events={},button={disabled:true},image={complete:false,naturalWidth:0,addEventListener:(name,fn)=>events[name]=fn};let prints=0;
 vm.runInNewContext(readFileSync(new URL('../dist/print.js',import.meta.url),'utf8'),{window:{print:()=>prints++},document:{getElementById:id=>id==='print-qr'?button:image}});
 button.onclick();assert.equal(prints,0);events.load();button.onclick();assert.equal(prints,1);
});
