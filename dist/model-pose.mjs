export const DEFAULT_MODEL_YAW=Math.PI/2;
export const MARKER_OFFSET_METERS=2;
// Move beyond the marker away from the viewing camera, parallel to the ground.
// Preserve marker height; do not lift the model along a downward camera ray.
export function beyondMarker(marker,camera,forward={x:0,y:0,z:-1}){
  let x=marker.x-camera.x,z=marker.z-camera.z;
  let length=Math.hypot(x,z);
  if(length<.01){x=forward.x;z=forward.z;length=Math.hypot(x,z);}
  if(length<.01){x=0;z=-1;length=1;}
  return {x:marker.x+x/length*MARKER_OFFSET_METERS,y:marker.y,z:marker.z+z/length*MARKER_OFFSET_METERS};
}
