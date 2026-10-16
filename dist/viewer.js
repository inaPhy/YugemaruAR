import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindModelGestures} from './gestures.mjs';
import {fitModelWidth} from './model-size.mjs';
import {DEFAULT_MODEL_YAW} from './model-pose.mjs';
const canvas=document.getElementById('viewer'),status=document.getElementById('status'),reset=document.getElementById('reset-view'),loading=document.getElementById('loading');
let size=1,angle=DEFAULT_MODEL_YAW,ready=false,renderer,visual,radius=1;
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e2ecb8');
  const camera=new THREE.PerspectiveCamera(40,1,.01,1000);
  scene.add(new THREE.HemisphereLight(0xffffff,0x899887,2));
  const light=new THREE.DirectionalLight(0xffffff,2.3);light.position.set(1,3,2);scene.add(light);
  visual=new THREE.Group();visual.rotation.y=angle;scene.add(visual);
  function render(){renderer.render(scene,camera);}
  function apply(){visual.scale.setScalar(size);visual.rotation.y=angle;render();}
  function resize(){
    renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    const halfVertical=THREE.MathUtils.degToRad(camera.fov/2),halfHorizontal=Math.atan(Math.tan(halfVertical)*camera.aspect);
    // Fit a bounding sphere so rotating doesn't clip an elongated ship.
    const distance=radius/Math.sin(Math.min(halfVertical,halfHorizontal)) * 1.18;
    camera.position.set(0,distance*.12,distance);camera.lookAt(0,0,0);render();
  }
  const clearGestures=bindModelGestures(canvas,{enabled:()=>ready,read:()=>({scale:size,angle}),write:next=>{size=next.scale;angle=next.angle;apply();}});
  canvas.addEventListener('wheel',event=>{if(!ready)return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);size=Math.max(.3,Math.min(3,size*Math.exp(-delta*.001)));apply();},{passive:false});
  reset.onclick=()=>{clearGestures();size=1;angle=DEFAULT_MODEL_YAW;apply();};
  window.addEventListener('resize',resize);resize();
  new GLTFLoader().loadAsync('assets/yugemaru.glb',e=>{if(e.lengthComputable && e.total>0)status.textContent=`モデルを読み込んでいます… ${Math.min(99,Math.floor(e.loaded/e.total*100))}%`;}).then(gltf=>{
    const model=fitModelWidth(gltf.scene),box=new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));model.updateMatrixWorld(true);
    const sphere=new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());radius=sphere.radius;
    visual.add(model);ready=true;loading.hidden=true;reset.disabled=false;status.textContent='弓削丸を自由に眺めてみましょう';resize();
  }).catch(()=>{loading.hidden=true;status.textContent='モデルを読み込めませんでした。再読み込みしてください。';});
}catch(error){document.getElementById('loading').hidden=true;status.textContent='3D表示を開始できませんでした。WebGL対応ブラウザで開いてください。';console.error(error);}
