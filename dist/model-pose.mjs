export const DEFAULT_MODEL_YAW=Math.PI/2;
export const BEHIND_DISTANCE_METERS=2;
// Place behind the viewing camera on the horizontal plane.
// Preserve marker height; do not lift the model along a downward camera ray.
export function behindCamera(marker,camera,forward={x:0,y:0,z:-1}){
  let x=forward.x,z=forward.z;
  let length=Math.hypot(x,z);
  if(length<.01){x=marker.x-camera.x;z=marker.z-camera.z;length=Math.hypot(x,z);}
  if(length<.01){x=0;z=-1;length=1;}
  return {x:camera.x-x/length*BEHIND_DISTANCE_METERS,y:marker.y,z:camera.z-z/length*BEHIND_DISTANCE_METERS};
}
