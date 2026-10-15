import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindModelGestures} from './gestures.mjs';
import {fitModelWidth} from './model-size.mjs';
import {Placement} from './placement.mjs';
window.THREE=THREE;
const $=id=>document.getElementById(id);
const placement=new Placement();
let xr, anchor, visual, modelReady=false, normal=false, error=false, size=1, angle=0, running=false;
function message(phase,title,hint){for(const [id,text] of [['phase',phase],['status',title],['hint',hint]]){if($(id).textContent!==text)$(id).textContent=text;}}
function fail(title,hint='SafariまたはChromeで開き直し、カメラの権限を確認してください。'){
  window.releaseInitialCamera?.();error=true;$('hud').classList.add('error');message('CHECK',title,hint);$('retry').hidden=false;
}
function update(){
  if(error)return;
  if(!modelReady){message('LOADING','弓削丸を読み込んでいます','初回は読み込みに少し時間がかかります。');return;}
  if(placement.pose){
    if(placement.tracking)message('QR TRACKING','QRの位置に追従しています',normal?'初期横幅は約2m。ピンチで拡大縮小、スワイプで回転できます。':'実寸を推定中です。周囲も映しながら端末をゆっくり動かしてください。');
    else message(normal?'POSITION HELD':'TRACKING',normal?'最後の位置に表示しています':'周囲をゆっくり映してください',normal?'QRを再び映すと、その位置へ再配置します。':'空間の位置を再確認しています。QRを映すと配置を更新できます。');
    return;
  }
  message('FIND YOUR QR','同じQRコードを映してください','QR全体と周囲の模様を映してください。初期横幅は約2mです。');
}
$('help-toggle').onclick=()=>{const open=$('help').hidden;$('help').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));};
$('retry').onclick=()=>location.reload();
const resetGestures=bindModelGestures($('camerafeed'),{enabled:()=>!!placement.pose && modelReady && !error,read:()=>({scale:size,angle}),write:next=>{size=next.scale;angle=next.angle;controls();}});
function controls(){visual.scale.setScalar(size);visual.rotation.y=angle;}
$('smaller').onclick=()=>{size=Math.max(.3,size-.15);controls();};
$('larger').onclick=()=>{size=Math.min(3,size+.15);controls();};
$('rotate').onclick=()=>{angle+=Math.PI/4;controls();};
$('reset').onclick=()=>{resetGestures();placement.reset();anchor.visible=false;size=1;angle=0;controls();document.querySelectorAll('#actions button').forEach(b=>b.disabled=true);update();};
function receive({detail}){
  if(!modelReady || error)return;
  const pose=placement.observe(detail);
  if(!pose)return;
  anchor.position.copy(pose.position);anchor.quaternion.copy(pose.rotation);anchor.scale.setScalar(1);
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
  onUpdate:({processCpuResult})=>{const reality=processCpuResult?.reality;if(reality){const next=reality.trackingStatus==='NORMAL';if(normal!==next){normal=next;update();}}},
  onException:(e)=>{console.error('AR engine error',e);fail('ARを開始・継続できませんでした','この端末のブラウザでカメラとモーションの使用を許可して再読み込みしてください。');},
  listeners:[
    {event:'reality.imagefound',process:receive},
    {event:'reality.imageupdated',process:receive},
    {event:'reality.imagelost',process:({detail})=>{placement.lost(detail?.name);update();}},
    {event:'reality.trackingstatus',process:({detail})=>{normal=detail.status==='NORMAL';update();}}
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
    if(!permission?.ok){fail('カメラを開始できませんでした',permission?.name==='NotAllowedError'?'サイトのカメラ権限を許可し、再読み込みしてください。':'カメラが使用できる状態か確認して再読み込みしてください。');return;}
    message('LOADING','ARを準備しています','カメラの許可を確認しました。');
    const [engine,model,target]=await Promise.all([loadEngine(),loadModel(),fetch('image-targets/yugemaru-qr.json').then(r=>{if(!r.ok)throw new Error('target-download');return r.json();})]);
    xr=engine;
    xr.XrController.configure({disableWorldTracking:false,imageTargetData:[target],scale:'absolute'});
    xr.addCameraPipelineModules([xr.GlTextureRenderer.pipelineModule(),xr.Threejs.pipelineModule(),xr.XrController.pipelineModule(),pipeline(model)]);
    fitCanvas();window.addEventListener('resize',fitCanvas);
    const run=()=>{window.releaseInitialCamera?.();message('PERMISSION','カメラの使用を許可してください','QRコード全体を映すと、自動で配置します。');try{xr.run({canvas:$('camerafeed'),allowedDevices:xr.XrConfig.device().MOBILE,cameraConfig:{direction:xr.XrConfig.camera().BACK}});}catch(e){fail('この端末でARを開始できませんでした','iPhone・AndroidのブラウザからQRコードを開いてください。');}};
    // Previously granted motion permission can continue automatically. A first
    // grant may require a real user gesture; it must never gate camera permission.
    if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
      let motionGranted=false;
      try{motionGranted=(await DeviceOrientationEvent.requestPermission())==='granted';}catch{}
      if(motionGranted){run();return;}
      message('PERMISSION','端末の動きを許可してください','カメラは許可済みです。空間に固定するため、端末の動きも許可してください。');
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
