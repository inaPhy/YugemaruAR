import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindModelGestures} from './gestures.mjs';
import {fitModelWidth} from './model-size.mjs';
import {DEFAULT_MODEL_YAW} from './model-pose.mjs';
import {Placement} from './placement.mjs';
window.THREE=THREE;
const $=id=>document.getElementById(id);
const placement=new Placement();
let xr, anchor, visual, modelReady=false, error=false, size=1, angle=DEFAULT_MODEL_YAW, running=false, resetting=false, departed=false, runRequested=false, deferredRun=null;
function message(phase,title,hint){for(const [id,text] of [['phase',phase],['status',title],['hint',hint]]){if($(id).textContent!==text)$(id).textContent=text;}}
function fail(title,hint='SafariまたはChromeで開き直し、カメラの権限を確認してください。'){
  if(error)return;
  error=true;running=false;deferredRun=null;
  try{xr?.stop();}catch(e){console.error('AR stop failed',e);}
  window.releaseInitialCamera?.();error=true;$('hud').classList.add('error');message('CHECK',title,hint);$('retry').hidden=false;
}
function update(){
  if(error || resetting)return;
  if(!modelReady){message('LOADING','弓削丸を読み込んでいます','初回は読み込みに少し時間がかかります。');return;}
  if(placement.tracking){message('QR TRACKING','弓削丸を表示しています','ピンチで拡大縮小、スワイプで回転できます。');return;}
  message('FIND YOUR QR','同じQRコードを映してください','QRコード全体をカメラに映してください。');
}
$('retry').onclick=()=>location.reload();
const resetGestures=bindModelGestures($('camerafeed'),{enabled:()=>!!placement.pose && modelReady && !error,read:()=>({scale:size,angle}),write:next=>{size=next.scale;angle=next.angle;controls();}});
function controls(){visual.scale.setScalar(size);visual.rotation.y=angle;}
$('smaller').onclick=()=>{size=Math.max(.3,size-.15);controls();};
$('larger').onclick=()=>{size=Math.min(3,size+.15);controls();};
$('rotate').onclick=()=>{angle+=Math.PI/4;controls();};
function resetPlacement(){
  if(!modelReady || resetting)return;
  resetting=true;resetGestures();placement.reset();
  size=1;angle=DEFAULT_MODEL_YAW;
  anchor.visible=false;anchor.position.set(0,0,0);anchor.quaternion.identity();anchor.scale.setScalar(1);
  visual.position.set(0,0,0);visual.rotation.set(0,DEFAULT_MODEL_YAW,0);visual.scale.setScalar(1);
  
  document.querySelectorAll('#actions button').forEach(b=>b.disabled=true);
  message('RESET','置き直しています','QRコードを映してください。');
  resetting=false;update();
}
$('reset').onclick=resetPlacement;
function receive({detail}){
  if(!modelReady || error || resetting)return;
  const pose=placement.observe(detail);
  if(!pose)return;
  anchor.position.copy(pose.position);anchor.quaternion.copy(pose.rotation);
  // A two-unit model spans twice the detected QR width; no metric estimation.
  const qrWidth=Number.isFinite(detail.scaledWidth)&&detail.scaledWidth>0?detail.scaledWidth:1;
  const targetScale=Number.isFinite(detail.scale)&&detail.scale>0?detail.scale:1;
  anchor.scale.setScalar(qrWidth*targetScale);
  anchor.visible=true;document.querySelectorAll('#actions button').forEach(b=>b.disabled=false);update();
}
function loseMarker({detail}){
  if(detail?.name && detail.name!=='yugemaru-qr')return;
  placement.lost(detail?.name);if(anchor)anchor.visible=false;update();
}
function pipeline(model){return {
  name:'yugemaru-world-placement',
  onStart:()=>{
    if(error || departed){xr.stop();return;}
    if(modelReady){if(document.hidden)xr.pause();return;}
    const {scene,camera,renderer}=xr.Threejs.xrScene();
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene.add(new THREE.HemisphereLight(0xffffff,0x899887,2));
    const light=new THREE.DirectionalLight(0xffffff,2.3);light.position.set(1,3,2);scene.add(light);
    anchor=new THREE.Group();anchor.visible=false;
    // QR target is in XY, facing +Z. Rotate the model's up axis to target +Z.
    const surface=new THREE.Group();surface.rotation.x=Math.PI/2;
    visual=new THREE.Group();visual.rotation.y=DEFAULT_MODEL_YAW;visual.add(model);surface.add(visual);anchor.add(surface);scene.add(anchor);
    camera.position.set(0,0,0);xr.XrController.updateCameraProjectionMatrix({origin:camera.position,facing:camera.quaternion});
    running=true;modelReady=true;if(document.hidden)xr.pause();update();
  },
  onCameraStatusChange:({status})=>{if(status==='failed')fail('カメラを開始できませんでした');else if(status==='requesting')message('PERMISSION','カメラの使用を許可してください','このページの中でカメラを使います。');},

  onException:(e)=>{console.error('AR engine error',e);fail('ARを開始・継続できませんでした','この端末のブラウザでカメラの使用を許可して再読み込みしてください。');},
  listeners:[
    {event:'reality.imagefound',process:receive},
    {event:'reality.imageupdated',process:receive},
    {event:'reality.imagelost',process:loseMarker}
  ]
};}
function loadEngine(){return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('engine-timeout')),45000);
  const loaded=()=>{clearTimeout(timeout);resolve(window.XR8);};
  window.addEventListener('xrloaded',loaded,{once:true});
  const script=document.createElement('script');script.src='vendor/xr/xr.js';script.async=true;script.dataset.preloadChunks='slam';
  script.onerror=()=>{clearTimeout(timeout);reject(new Error('engine-download'));};document.head.appendChild(script);
});}
function loadModel(){return new GLTFLoader().loadAsync('assets/yugemaru.glb').then(gltf=>fitModelWidth(gltf.scene));}
function fitCanvas(){const canvas=$('camerafeed');canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
async function start(){
  if(!isSecureContext || !navigator.mediaDevices?.getUserMedia){fail('カメラを利用できません','HTTPSのURLをSafariまたはChromeで開いてください。');return;}
  try{
    const permission=await window.initialCameraPermission;
    if(departed)return;
    if(!permission?.ok){fail('カメラを開始できませんでした',permission?.name==='NotAllowedError'?'サイトのカメラ権限を許可し、再読み込みしてください。':'カメラが使用できる状態か確認して再読み込みしてください。');return;}
    message('LOADING','ARを準備しています','カメラの許可を確認しました。');
    const [engine,model,target]=await Promise.all([loadEngine(),loadModel(),fetch('image-targets/yugemaru-qr.json').then(r=>{if(!r.ok)throw new Error('target-download');return r.json();})]);
    if(departed || error)return;
    xr=engine;
    xr.XrController.configure({disableWorldTracking:true,imageTargetData:[target],scale:'responsive'});
    xr.addCameraPipelineModules([xr.GlTextureRenderer.pipelineModule(),xr.Threejs.pipelineModule(),xr.XrController.pipelineModule(),pipeline(model)]);
    fitCanvas();window.addEventListener('resize',fitCanvas);
    const run=()=>{if(departed || error || runRequested)return;if(document.hidden){deferredRun=run;return;}deferredRun=null;runRequested=true;window.releaseInitialCamera?.();message('PERMISSION','カメラの使用を許可してください','QRコード全体を映すと、自動で配置します。');try{xr.run({canvas:$('camerafeed'),allowedDevices:xr.XrConfig.device().MOBILE,cameraConfig:{direction:xr.XrConfig.camera().BACK}});}catch(e){fail('この端末でARを開始できませんでした','iPhone・AndroidのブラウザからQRコードを開いてください。');}};
    run();
  }catch(e){console.error('AR startup failed',e);fail('ARの準備に失敗しました','通信状態を確認し、再読み込みしてください。');}
}
window.addEventListener('pagehide',()=>{departed=true;running=false;deferredRun=null;window.releaseInitialCamera?.();if(xr)xr.stop();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.addEventListener('visibilitychange',()=>{if(error||departed)return;if(!document.hidden && deferredRun){deferredRun();return;}if(!xr||!running)return;if(document.hidden)xr.pause();else xr.resume();});
start();
