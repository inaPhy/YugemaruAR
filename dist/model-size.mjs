import {Box3,Vector3} from './vendor/three/three.module.js';
export const INITIAL_WIDTH_METERS=5;
// Run on the unattached GLTF scene, before user or marker transforms.
export function fitModelWidth(model,width=INITIAL_WIDTH_METERS){
  const box=new Box3().setFromObject(model);
  const dimensions=box.getSize(new Vector3()),center=box.getCenter(new Vector3());
  if(!Number.isFinite(dimensions.x) || dimensions.x<=0 || !Number.isFinite(width) || width<=0)throw new Error('Invalid model width');
  const factor=width/dimensions.x;
  model.scale.multiplyScalar(factor);
  model.position.set((model.position.x-center.x)*factor,(model.position.y-box.min.y)*factor,(model.position.z-center.z)*factor);
  model.updateMatrixWorld(true);
  return model;
}
