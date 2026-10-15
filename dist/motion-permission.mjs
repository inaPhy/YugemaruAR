// Invoke both APIs before awaiting so a button's activation reaches both requests.
export function requestMotionPermission(scope=globalThis){
  const sensors=[scope.DeviceOrientationEvent,scope.DeviceMotionEvent].filter(sensor=>typeof sensor?.requestPermission==='function');
  const requests=sensors.map(sensor=>{try{return Promise.resolve(sensor.requestPermission());}catch(error){return Promise.reject(error);}});
  return Promise.all(requests).then(results=>results.every(result=>result==='granted'),()=>false);
}
