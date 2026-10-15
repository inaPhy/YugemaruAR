'use strict';
const statusEl = document.querySelector('#status');
const hud = document.querySelector('#hud');
let ready = false, camera = false, found = false, failed = false, size = 1, rotation = 0;
function update(){if(failed)return;statusEl.textContent=!camera?'カメラの使用を許可してください':!ready?'ゆげまるを読み込んでいます…':found?'ゆげまるに会えました！ サイズと向きを変えてみよう':'Hiroマーカーの黒い枠全体を映してください';}
function fail(message){failed=true;hud.classList.add('error');statusEl.textContent=message;}
document.querySelector('#help-toggle').onclick=()=>{const open=document.querySelector('#help').classList.toggle('visible');document.querySelector('#help-toggle').setAttribute('aria-expanded',String(open));};
if(!window.AFRAME || !AFRAME.systems.arjs){fail('ARの読み込みに失敗しました。再読み込みしてください。');}
else if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){fail('HTTPSでこのページを開き、カメラ対応ブラウザを使用してください。');}
else{
AFRAME.registerComponent('fit-yugemaru',{
 init(){this.el.addEventListener('model-loaded',()=>{const model=this.el.getObject3D('mesh');const parent=model.parent;parent.remove(model);model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model);parent.add(model);const dimensions=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());const factor=1.6/Math.max(dimensions.x,dimensions.y,dimensions.z);model.scale.multiplyScalar(factor);model.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);ready=true;document.querySelectorAll('#controls button').forEach(b=>b.disabled=false);update();});this.el.addEventListener('model-error',()=>fail('3Dモデルを読み込めませんでした。通信状態を確認して再読み込みしてください。'));}
});
window.addEventListener('camera-init',()=>{camera=true;update();});
window.addEventListener('camera-error',()=>fail('カメラを開始できませんでした。カメラ権限を確認してください。'));
const scene=document.createElement('a-scene');
scene.setAttribute('embedded','');scene.setAttribute('vr-mode-ui','enabled: false');scene.setAttribute('device-orientation-permission-ui','enabled: false');scene.setAttribute('renderer','alpha: true; antialias: true; colorManagement: true');scene.setAttribute('arjs','sourceType: webcam; debugUIEnabled: false; trackingMethod: best; cameraParametersUrl: assets/camera_para.dat;');
scene.innerHTML='<a-entity light="type: ambient; intensity: 1.5"></a-entity><a-entity light="type: directional; intensity: 2" position="1 3 2"></a-entity><a-marker type="pattern" url="assets/patt.hiro" smooth="true" smooth-count="5"><a-entity id="model" fit-yugemaru gltf-model="url(assets/yugemaru.glb)"></a-entity></a-marker><a-entity camera></a-entity>';
const marker=scene.querySelector('a-marker');marker.addEventListener('markerFound',()=>{found=true;update();});marker.addEventListener('markerLost',()=>{found=false;update();});
document.body.appendChild(scene);
const model=scene.querySelector('#model');function apply(){model.object3D.scale.setScalar(size);model.object3D.rotation.y=rotation;}
document.querySelector('#smaller').onclick=()=>{size=Math.max(.3,size-.15);apply();};document.querySelector('#larger').onclick=()=>{size=Math.min(3,size+.15);apply();};document.querySelector('#rotate').onclick=()=>{rotation+=Math.PI/4;apply();};
window.addEventListener('pagehide',()=>{document.querySelectorAll('video').forEach(v=>v.srcObject?.getTracks().forEach(t=>t.stop()));});
}
