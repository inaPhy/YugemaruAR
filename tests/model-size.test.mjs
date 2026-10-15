import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshBasicMaterial,Box3,Vector3} from '../dist/vendor/three/three.module.js';
import {fitModelWidth} from '../dist/model-size.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('initial width is five meters with proportions retained and base centered',()=>{
 const root=new Group();const mesh=new Mesh(new BoxGeometry(2,1,4),new MeshBasicMaterial());mesh.position.set(4,3,-2);root.add(mesh);root.position.set(1,2,3);
 fitModelWidth(root);const box=new Box3().setFromObject(root),d=box.getSize(new Vector3()),c=box.getCenter(new Vector3());near(d.x,5);near(d.y,2.5);near(d.z,10);near(box.min.y,0);near(c.x,0);near(c.z,0);
});
