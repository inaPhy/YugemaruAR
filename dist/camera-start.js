// Ask immediately, before downloading the AR engine or requesting motion.
(() => {
  let stream, disposed = false;
  window.releaseInitialCamera = () => {
    disposed = true;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
  };
  window.addEventListener('pagehide', window.releaseInitialCamera);
  window.initialCameraPermission = (async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      return {ok: false, name: 'UnsupportedError'};
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: 'environment'}}, audio: false});
      // This stream only checks permission; the AR engine owns its own camera.
      window.releaseInitialCamera();
      return {ok: true};
    } catch (error) {
      return {ok: false, name: error.name};
    }
  })();
})();
