(() => {
  const button=document.getElementById('print-qr'),image=document.getElementById('print-image');
  const ready=()=>{button.disabled=false;};
  if(image.complete && image.naturalWidth)ready();else image.addEventListener('load',ready,{once:true});
  image.addEventListener('error',()=>{button.disabled=true;button.title='QR画像を読み込めませんでした。再読み込みしてください。';},{once:true});
  button.onclick=()=>{if(!button.disabled)window.print();};
})();
