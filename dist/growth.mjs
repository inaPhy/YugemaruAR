export class ModelGrowth {
  constructor(){this.reset();}
  reset(){this.started=false;this.elapsed=0;this.last=null;}
  start(now){if(this.started)return;this.started=true;this.last=now;}
  pause(){this.last=null;}
  tick(now){
    if(!this.started)return 1;
    if(this.last!==null)this.elapsed=Math.min(5000,this.elapsed+Math.max(0,now-this.last));
    this.last=now;
    return 1+29*(this.elapsed/5000);
  }
}
