// Capture an initial QR pose only after a short stable observation. The result
// belongs to the SLAM world; image loss / later QR movement never change it.
export class Placement {
  constructor(){ this.reset(); }
  reset(){ this.pose=null; this.candidate=null; this.frames=0; this.since=0; this.last=0; }
  lost(){ if(!this.pose){ this.candidate=null; this.frames=0; } }
  observe(detail, normal, now){
    if(this.pose || !normal || detail.name!=='yugemaru-qr') return null;
    const {position:p,rotation:q,scale:s}=detail;
    if(!p || !q || ![p.x,p.y,p.z,q.x,q.y,q.z,q.w,s].every(Number.isFinite) || s<=0) return null;
    const n=Math.hypot(q.x,q.y,q.z,q.w);if(n<.001)return null;
    const next={position:{...p},rotation:{x:q.x/n,y:q.y/n,z:q.z/n,w:q.w/n},scale:s};
    const c=this.candidate;
    const dot=c?Math.abs(c.rotation.x*next.rotation.x+c.rotation.y*next.rotation.y+c.rotation.z*next.rotation.z+c.rotation.w*next.rotation.w):0;
    const stable=c && now-this.last<300 && Math.hypot(p.x-c.position.x,p.y-c.position.y,p.z-c.position.z)<s*.08 && Math.abs(s/c.scale-1)<.12 && dot>.99;
    if(!stable){this.candidate=next;this.frames=1;this.since=now;}else{this.frames++;}
    this.last=now;
    if(this.frames>=6 && now-this.since>=450){this.pose=next;return next;}
    return null;
  }
}
