import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindModelGestures} from './gestures.mjs';
import {fitModelWidth} from './model-size.mjs';
import {DEFAULT_MODEL_YAW} from './model-pose.mjs';
import {requestMotionPermission} from './motion-permission.mjs';
import {ModelAnimation} from './model-animation.mjs';
import {ModelGrowth} from './growth.mjs';
import {Placement} from './placement.mjs';
window.THREE=THREE;
const $=id=>document.getElementById(id);
const placement=new Placement();
const growth=new ModelGrowth();
const panWorld=new THREE.Vector3(),panRight=new THREE.Vector3(),panUp=new THREE.Vector3();
let modelAnimation;
let markerWidth=1, candidateWidth=1, hasPlaced=false, returnedToQr=false, printing=false;
const projectedQr=new THREE.Vector3(), cameraQr=new THREE.Vector3();
let xr, anchor, visual, modelReady=false, error=false, size=1, angle=DEFAULT_MODEL_YAW, running=false, resetting=false, departed=false, runRequested=false, deferredRun=null, trackingNormal=null;
function message(phase,title,hint){$('loading').hidden=phase!=='LOADING';for(const [id,text] of [['phase',phase],['status',title],['hint',hint]]){if($(id).textContent!==text)$(id).textContent=text;}}
function loadingText(text){if($('loading-text').textContent!==text)$('loading-text').textContent=text;}
function fail(title,hint='SafariまたはChromeで開き直し、カメラの権限を確認してください。'){
  if(error)return;
  modelAnimation?.pause();
  error=true;running=false;deferredRun=null;$('reset').hidden=true;
  try{xr?.stop();}catch(e){console.error('AR stop failed',e);}
  window.releaseInitialCamera?.();error=true;$('hud').classList.add('error');message('CHECK',title,hint);$('retry').hidden=false;
}
function update(){
  if(error || resetting)return;
  if(!modelReady){message('LOADING','弓削丸を読み込んでいます','初回は読み込みに少し時間がかかります。');return;}
  if(placement.pose && trackingNormal===false){message('TRACKING','周囲をゆっくり映してください','位置を確認しています。QRを映すと配置し直せます。');return;}
  if(returnedToQr && placement.tracking){message('QR TRACKING','ピンチで拡大縮小　1本指で回転　2本指で移動','初期状態に戻すには QRの「置き直す」をタップ');return;}
  if(placement.tracking){message('QR TRACKING','弓削丸を表示しています','ピンチで拡大縮小　1本指で回転　2本指で移動');return;}
  if(placement.pose){message('POSITION HELD','ピンチで拡大縮小　1本指で回転　2本指で移動','もとの位置に戻すにはQRを写してください');return;}
  message('FIND YOUR QR','QRコードを探しています。','QRコード全体をカメラで写してください。');
}
$('retry').onclick=()=>location.reload();
const resetGestures=bindModelGestures($('camerafeed'),{enabled:()=>!!placement.pose && modelReady && !error,read:()=>({scale:size,angle}),write:next=>{size=next.scale;angle=next.angle;panFromScreen(next.panX,next.panY);controls();}});
function panFromScreen(dx=0,dy=0){
  if((!dx&&!dy)||!xr||!anchor)return;
  const {camera}=xr.Threejs.xrScene();
  const canvas=$('camerafeed');
  const modelWidth=Math.max(anchor.scale.x*size*2,.01);
  const unitsPerPixel=modelWidth/Math.max(canvas.clientWidth,1);
  panRight.set(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(dx*unitsPerPixel);
  panUp.set(0,1,0).applyQuaternion(camera.quaternion).multiplyScalar(-dy*unitsPerPixel);
  panWorld.add(panRight).add(panUp);trackQrPose();
}
function controls(){visual.scale.setScalar(size);visual.rotation.y=angle;}
function trackQrPose(){
  if(!anchor || !placement.pose)return;
  anchor.position.copy(placement.pose.position).add(panWorld);anchor.quaternion.copy(placement.pose.rotation);
}
function placeAtQr(){
  resetGestures();growth.reset();size=1;angle=DEFAULT_MODEL_YAW;panWorld.set(0,0,0);
  visual.position.set(0,0,0);visual.rotation.set(0,angle,0);visual.scale.setScalar(1);
  trackQrPose();
  markerWidth=candidateWidth;hasPlaced=true;returnedToQr=false;
  growth.start(performance.now());updateGrowth();anchor.visible=true;
  $('reset').hidden=true;update();
}
$('reset').onclick=()=>{
  if(!modelReady || error || !hasPlaced || !returnedToQr || !placement.tracking || $('reset').hidden)return;
  placeAtQr();
};
function receive({detail}){
  if(!modelReady || error)return;
  const pose=placement.observe(detail);
  if(!pose)return;
  const qrWidth=Number.isFinite(detail.scaledWidth)&&detail.scaledWidth>0?detail.scaledWidth:1;
  const targetScale=Number.isFinite(detail.scale)&&detail.scale>0?detail.scale:1;
  candidateWidth=qrWidth*targetScale;
  if(!hasPlaced)placeAtQr();
  else trackQrPose();
  updateResetButton();update();
}
function updateResetButton(){
  const button=$('reset');
  if(error || printing || !hasPlaced || !returnedToQr || !placement.tracking){button.hidden=true;return;}
  const {camera}=xr.Threejs.xrScene();
  projectedQr.copy(placement.pose.position);cameraQr.copy(projectedQr).applyMatrix4(camera.matrixWorldInverse);
  projectedQr.project(camera);
  const visible=cameraQr.z<0 && projectedQr.z>=-1 && projectedQr.z<=1 && Math.abs(projectedQr.x)<.9 && Math.abs(projectedQr.y)<.9;
  button.hidden=!visible;
  if(visible){button.style.left=`${(projectedQr.x+1)*innerWidth/2}px`;button.style.top=`${(1-projectedQr.y)*innerHeight/2}px`;}
}
function updateGrowth(){
  if(anchor && placement.pose && !error)anchor.scale.setScalar(markerWidth*growth.tick(performance.now())/2);
}
function loseMarker({detail}){
  if(detail?.name && detail.name!=='yugemaru-qr')return;
  if(hasPlaced && placement.tracking)returnedToQr=true;
  placement.lost(detail?.name);$('reset').hidden=true;update();
}
function pipeline(model){return {
  name:'yugemaru-world-placement',
  onStart:()=>{
    if(error || departed){xr.stop();return;}
    if(modelReady){if(document.hidden || printing)xr.pause();return;}
    const {scene,camera,renderer}=xr.Threejs.xrScene();
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene.add(new THREE.HemisphereLight(0xffffff,0x899887,2));
    const light=new THREE.DirectionalLight(0xffffff,2.3);light.position.set(1,3,2);scene.add(light);
    anchor=new THREE.Group();anchor.visible=false;
    // QR target is in XY, facing +Z. Rotate the model's up axis to target +Z.
    const surface=new THREE.Group();surface.rotation.x=Math.PI/2;
    visual=new THREE.Group();visual.rotation.y=DEFAULT_MODEL_YAW;visual.add(model);surface.add(visual);anchor.add(surface);scene.add(anchor);
    camera.position.set(0,0,0);xr.XrController.updateCameraProjectionMatrix({origin:camera.position,facing:camera.quaternion});
    running=true;modelReady=true;if(document.hidden || printing)xr.pause();update();
  },
  onCameraStatusChange:({status})=>{if(status==='failed')fail('カメラを開始できませんでした');else if(status==='requesting')message('PERMISSION','カメラの使用を許可してください','このページの中でカメラを使います。');},

  onUpdate:({processCpuResult})=>{modelAnimation?.update(performance.now(),!!anchor?.visible && !error && !printing && !document.hidden);updateGrowth();updateResetButton();const status=processCpuResult?.reality?.trackingStatus;if(!status)return;const next=status==='NORMAL';if(trackingNormal!==next){trackingNormal=next;update();}},
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
function loadModel(){return new GLTFLoader().loadAsync('assets/yugemaru.glb',e=>{if(e.lengthComputable && e.total>0)loadingText(`弓削丸を読み込み中 ${Math.min(99,Math.floor(e.loaded/e.total*100))}%`);}).then(gltf=>{
  loadingText('ARを準備しています');
  // Keep normalization outside the animated root so authored transforms stay intact.
  const model=new THREE.Group();model.add(gltf.scene);fitModelWidth(model);
  if(!departed && !error)modelAnimation=new ModelAnimation(gltf.scene,gltf.animations);
  return model;
});}
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
    xr.XrController.configure({disableWorldTracking:false,imageTargetData:[target],scale:'responsive'});
    xr.addCameraPipelineModules([xr.GlTextureRenderer.pipelineModule(),xr.Threejs.pipelineModule(),xr.XrController.pipelineModule(),pipeline(model)]);
    fitCanvas();window.addEventListener('resize',fitCanvas);
    const run=()=>{if(departed || error || runRequested)return;if(document.hidden){deferredRun=run;return;}deferredRun=null;runRequested=true;window.releaseInitialCamera?.();message('PERMISSION','カメラの使用を許可してください','QRコード全体を映すと、自動で配置します。');try{xr.run({canvas:$('camerafeed'),allowedDevices:xr.XrConfig.device().MOBILE,cameraConfig:{direction:xr.XrConfig.camera().BACK}});}catch(e){fail('この端末でARを開始できませんでした','iPhone・AndroidのブラウザからQRコードを開いてください。');}};
    if(await requestMotionPermission()){run();return;}
    if(departed || error)return;
    message('PERMISSION','モーションの使用を許可してください','空間に固定するため、下のボタンを押して許可してください。');
    $('permission').hidden=false;
    $('permission').onclick=async()=>{
      $('permission').disabled=true;
      const granted=await requestMotionPermission();
      if(departed || error)return;
      $('permission').disabled=false;
      if(granted){$('permission').hidden=true;run();}
      else message('PERMISSION','モーションの使用が許可されませんでした','ブラウザの設定を確認し、もう一度許可してください。');
    };
  }catch(e){console.error('AR startup failed',e);fail('ARの準備に失敗しました','通信状態を確認し、再読み込みしてください。');}
}
window.addEventListener('pagehide',()=>{modelAnimation?.dispose();departed=true;running=false;deferredRun=null;window.releaseInitialCamera?.();if(xr)xr.stop();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.addEventListener('visibilitychange',()=>{growth.pause();modelAnimation?.pause();if(error||departed)return;if(!document.hidden && deferredRun){deferredRun();return;}if(!xr||!running)return;if(document.hidden || printing)xr.pause();else xr.resume();});
window.addEventListener('beforeprint',()=>{printing=true;growth.pause();modelAnimation?.pause();$('reset').hidden=true;if(xr && running)xr.pause();});
window.addEventListener('afterprint',()=>{printing=false;growth.pause();modelAnimation?.pause();if(xr && running && !error && !departed && !document.hidden)xr.resume();});
start();
