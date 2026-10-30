/* Applied before CSS to avoid status-bar overlap on installed iPhone PWAs. */
(function(){
  const iphone=/iPhone|iPod/i.test(navigator.userAgent||'');
  const standalone=navigator.standalone===true||
    (typeof matchMedia==='function'&&matchMedia('(display-mode: standalone)').matches);
  if(iphone&&standalone)document.documentElement.classList.add('scene-ios-standalone');
})();
