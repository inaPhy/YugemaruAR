export class ModelGesture {
  constructor(){this.previous=[];}
  reset(){this.previous=[];}
  update(points, scale, angle, width){
    const previous=this.previous;
    this.previous=points.map(p=>({...p}));
    let panX=0,panY=0;
    if(points.length!==previous.length || !points.every((p,i)=>p.id===previous[i]?.id))return {scale,angle,panX,panY};
    if(points.length===1) angle+=(points[0].x-previous[0].x)/Math.max(width,1)*Math.PI*2;
    if(points.length===2){
      const distance=ps=>Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);
      const before=distance(previous),after=distance(points);
      if(before>8 && after>8)scale=Math.min(3,Math.max(.3,scale*after/before));
      panX=(points[0].x+points[1].x-previous[0].x-previous[1].x)/2;
      panY=(points[0].y+points[1].y-previous[0].y-previous[1].y)/2;
    }
    return {scale,angle,panX,panY};
  }
}
export function bindModelGestures(canvas,{enabled,read,write}){
  const pointers=new Map(), gesture=new ModelGesture();
  const points=()=>[...pointers].map(([id,p])=>({id,...p}));
  function sample(){const {scale,angle}=read();write(gesture.update(points(),scale,angle,canvas.clientWidth));}
  canvas.addEventListener('pointerdown',event=>{
    if(!enabled() || (event.pointerType==='mouse' && event.button!==0))return;
    event.preventDefault();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture(event.pointerId);sample();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;
    if(!enabled()){pointers.clear();gesture.reset();return;}
    event.preventDefault();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});sample();
  });
  function end(event){if(!pointers.delete(event.pointerId))return;gesture.reset();if(pointers.size && enabled())sample();}
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,end);
  window.addEventListener('blur',()=>{pointers.clear();gesture.reset();});
  document.addEventListener('visibilitychange',()=>{pointers.clear();gesture.reset();});
  return ()=>{pointers.clear();gesture.reset();};
}
