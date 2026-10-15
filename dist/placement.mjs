// Prefer every valid QR pose. On image loss, retain the last world-space pose.
// Model size and user rotation are independent of this marker transform.
export class Placement {
  constructor(){this.reset();}
  reset(){this.pose=null;this.tracking=false;}
  lost(name='yugemaru-qr'){if(name==='yugemaru-qr')this.tracking=false;}
  observe(detail){
    if(detail?.name!=='yugemaru-qr')return null;
    const {position:p,rotation:q}=detail;
    if(!p || !q || ![p.x,p.y,p.z,q.x,q.y,q.z,q.w].every(Number.isFinite))return null;
    const n=Math.hypot(q.x,q.y,q.z,q.w);if(n<.001)return null;
    this.pose={position:{x:p.x,y:p.y,z:p.z},rotation:{x:q.x/n,y:q.y/n,z:q.z/n,w:q.w/n}};
    this.tracking=true;
    return this.pose;
  }
}
