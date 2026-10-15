import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Placement} from './placement.mjs';
window.THREE=THREE;
const $=id=>document.getElementById(id);
const placement=new Placement();
let xr, anchor, visual, modelReady=false, normal=false, error=false, size=1, angle=0, running=false;
function message(phase,title,hint){$('phase').textContent=phase;$('status').textContent=title;$('hint').textContent=hint;}
function fail(title,hint='SafariまたはChromeで開き直し、カメラの権限を確認してください。'){
  error=true;$('hud').classList.add('error');message('CHECK',title,hint);$('retry').hidden=false;
}
function update(){
  if(error)return;
  if(!modelReady){message('LOADING','ゆげまるを読み込んでいます','初回は読み込みに少し時間がかかります。');return;}
  if(placement.pose){message(normal?'PLACED':'TRACKING',normal?'ゆげまるを配置しました':'周囲をゆっくり映してください',normal?'QRコードから離れて、周りから眺めてみましょう。':'位置を再確認しています。QRを再認識しても配置は勝手に変わりません。');return;}
  message('FIND YOUR QR','同じQRコードを映してください',normal?'QR全体を映して、少しだけ静止してください。':'QRと周囲の模様を映しながら、端末をゆっくり動かしてください。');
}
$('help-toggle').onclick=()=>{const open=$('help').hidden;$('help').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));};
$('retry').onclick=()=>location.reload();
function controls(){visual.scale.setScalar(size);visual.rotation.y=angle;}
$('smaller').onclick=()=>{size=Math.max(.3,size-.15);controls();};
$('larger').onclick=()=>{size=Math.min(3,size+.15);controls();};
$('rotate').onclick=()=>{angle+=Math.PI/4;controls();};
$('reset').onclick=()=>{placement.reset();anchor.visible=false;size=1;angle=0;controls();document.querySelectorAll('#actions button').forEach(b=>b.disabled=true);update();};
function receive({detail}){
  if(!modelReady || error)return;
  const pose=placement.observe(detail,normal,performance.now());
  if(!pose)return;
  anchor.position.copy(pose.position);anchor.quaternion.copy(pose.rotation);anchor.scale.setScalar(pose.scale);
  anchor.visible=true;document.querySelectorAll('#actions button').forEach(b=>b.disabled=false);update();
}
function pipeline(model){return {
  name:'yugemaru-world-placement',
  onStart:()=>{
    const {scene,camera,renderer}=xr.Threejs.xrScene();
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene.add(new THREE.HemisphereLight(0xffffff,0x899887,2));
    const light=new THREE.DirectionalLight(0xffffff,2.3);light.position.set(1,3,2);scene.add(light);
    anchor=new THREE.Group();anchor.visible=false;
    // QR target is in XY, facing +Z. Rotate the model's up axis to target +Z.
    const surface=new THREE.Group();surface.rotation.x=Math.PI/2;
    visual=new THREE.Group();visual.add(model);surface.add(visual);anchor.add(surface);scene.add(anchor);
    camera.position.set(0,2,0);xr.XrController.updateCameraProjectionMatrix({origin:camera.position,facing:camera.quaternion});
    running=true;modelReady=true;update();
  },
  onCameraStatusChange:({status})=>{if(status==='failed')fail('カメラを開始できませんでした');else if(status==='requesting')message('PERMISSION','カメラの使用を許可してください','このページの中でカメラを使います。');},
  onUpdate:({processCpuResult})=>{const reality=processCpuResult?.reality;if(reality){const next=reality.trackingStatus==='NORMAL';if(normal!==next){normal=next;if(!normal)placement.lost();update();}}},
  onException:(e)=>{console.error('AR engine error',e);fail('ARを開始・継続できませんでした','この端末のブラウザでカメラとモーションの使用を許可して再読み込みしてください。');},
  listeners:[
    {event:'reality.imagefound',process:receive},
    {event:'reality.imageupdated',process:receive},
    {event:'reality.imagelost',process:()=>placement.lost()},
    {event:'reality.trackingstatus',process:({detail})=>{normal=detail.status==='NORMAL';if(!normal)placement.lost();update();}}
  ]
};}
function loadEngine(){return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('engine-timeout')),45000);
  const loaded=()=>{clearTimeout(timeout);resolve(window.XR8);};
  window.addEventListener('xrloaded',loaded,{once:true});
  const script=document.createElement('script');script.src='vendor/xr/xr.js';script.async=true;script.dataset.preloadChunks='slam';
  script.onerror=()=>{clearTimeout(timeout);reject(new Error('engine-download'));};document.head.appendChild(script);
});}
function loadModel(){return new GLTFLoader().loadAsync('assets/yugemaru.glb').then(gltf=>{
  const m=gltf.scene;const box=new THREE.Box3().setFromObject(m),dims=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=1.4/Math.max(dims.x,dims.y,dims.z);m.scale.multiplyScalar(scale);m.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);return m;
});}
function fitCanvas(){const canvas=$('camerafeed');canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
async function start(){
  if(!isSecureContext || !navigator.mediaDevices?.getUserMedia){fail('カメラを利用できません','HTTPSのURLをSafariまたはChromeで開いてください。');return;}
  try{
    const [engine,model,target]=await Promise.all([loadEngine(),loadModel(),fetch('image-targets/yugemaru-qr.json').then(r=>{if(!r.ok)throw new Error('target-download');return r.json();})]);
    xr=engine;
    xr.XrController.configure({disableWorldTracking:false,imageTargetData:[target],scale:'responsive'});
    xr.addCameraPipelineModules([xr.GlTextureRenderer.pipelineModule(),xr.Threejs.pipelineModule(),xr.XrController.pipelineModule(),pipeline(model)]);
    fitCanvas();window.addEventListener('resize',fitCanvas);
    const run=()=>{message('PERMISSION','カメラの使用を許可してください','QRコード全体を映すと、自動で配置します。');try{xr.run({canvas:$('camerafeed'),allowedDevices:xr.XrConfig.device().MOBILE,cameraConfig:{direction:xr.XrConfig.camera().BACK}});}catch(e){fail('この端末でARを開始できませんでした','iPhone・AndroidのブラウザからQRコードを開いてください。');}};
    // iOS requires an actual tap for motion permission. Do not promise that this
    // OS permission can be granted automatically by a page navigation.
    if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
      message('PERMISSION','端末の動きの使用を許可してください','空間の同じ場所に表示するため、モーションとカメラを使います。');
      $('permission').hidden=false;
      $('permission').onclick=async()=>{
        try{const result=await DeviceOrientationEvent.requestPermission();if(result!=='granted')throw new Error('denied');$('permission').hidden=true;run();}catch(e){fail('端末の動きが許可されませんでした','Safariのサイト設定を確認し、再読み込みしてください。');}
      };
    }else run();
  }catch(e){console.error('AR startup failed',e);fail('ARの準備に失敗しました','通信状態を確認し、再読み込みしてください。');}
}
window.addEventListener('pagehide',()=>{if(xr)xr.stop();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.addEventListener('visibilitychange',()=>{if(!xr||!running||error)return;if(document.hidden)xr.pause();else xr.resume();});
start();
