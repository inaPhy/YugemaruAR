import {AnimationMixer} from './vendor/three/three.module.js';
export class ModelAnimation {
  constructor(root,clips){
    this.root=root;this.mixer=new AnimationMixer(root);this.last=null;
    // Match model-viewer's autoplay: play the first authored animation.
    if(clips.length)this.mixer.clipAction(clips[0]).play();
  }
  pause(){this.last=null;}
  update(now,active=true){
    if(!active){this.pause();return;}
    if(this.last!==null)this.mixer.update(Math.min(.1,Math.max(0,(now-this.last)/1000)));
    this.last=now;
  }
  dispose(){this.pause();this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);}
}
